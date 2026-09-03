# FastAPI service: takes a list of URLs, screenshots each at desktop (1440x900) and
# mobile (390x844) sizes using headless Chromium via Playwright, uploads PNGs to GCS.
# Runs on the GCP VM, managed by PM2, listens on port 3333.
# Called from n8n via an HTTP Request node: POST http://<vm-ip>:3333/screenshot
# Body: {"urls": ["<website_clean value>"]}

import os
import uuid
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from playwright.async_api import async_playwright
from google.cloud import storage

# ====== CONFIG ======
BUCKET_NAME = "n8n-outreach-invfewq"
CHROMIUM_PATH = "/usr/bin/chromium"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

app = FastAPI()
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

class ScreenshotRequest(BaseModel):
    urls: List[str]

def upload_to_gcs(file_path: str) -> str:
    blob_name = os.path.basename(file_path)
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(file_path)
    os.remove(file_path)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_name}"

async def capture(urls: List[str]):
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=CHROMIUM_PATH,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        for url in urls:
            page_id = uuid.uuid4().hex[:8]
            # Desktop
            page = await browser.new_page(viewport=DESKTOP)
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(5000)
            d_path = f"/tmp/{page_id}-desktop.png"
            await page.screenshot(path=d_path, full_page=True)
            await page.close()
            # Mobile
            page = await browser.new_page(viewport=MOBILE, is_mobile=True)
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(5000)
            m_path = f"/tmp/{page_id}-mobile.png"
            await page.screenshot(path=m_path, full_page=True)
            await page.close()

            results.append({
                "url": url,
                "desktop": upload_to_gcs(d_path),
                "mobile": upload_to_gcs(m_path),
            })
        await browser.close()
    return results

@app.post("/screenshot")
async def screenshot(req: ScreenshotRequest):
    return {"results": await capture(req.urls)}
