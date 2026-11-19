# AEGIS — Next Steps & Final Submission Preparation

## 1. Local Testing & Verification (Completed)
- [x] All 48 automated tests passing (`python -m pytest tests/ -v`).
- [x] Frontend successfully built (`npm.cmd run build` $\to$ `apps/web/dist`).
- [x] FastAPI static mount tested and serving SPA on `/`.

---

## 2. Running AEGIS Locally
To run the full platform locally:
```powershell
cd "c:\Users\mindo\Documents\Builder Center\aegis"
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```
Then open your browser to [http://localhost:8000](http://localhost:8000).

---

## 3. Hackathon Submission Checklist (Target: Dec 2, 2026)
1. **GitHub Repository Setup:**
   - Commit all current code and documentation to Git.
   - Create public GitHub repository `mindofyaseen/aegis` and push code.
2. **Record 3-Minute Demonstration Video:**
   - Follow the detailed script in `docs/hackathon/DEMO_SCRIPT.md`.
   - Walk through the three scenarios on the live dashboard (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`).
   - Highlight the interactive topology graph, attack path, and Rule 14 remediation diffs.
   - Show the 28 passing tests in the terminal.
   - Upload video to YouTube / Vimeo (set to Public or Unlisted).
3. **Submit on AWS Builder Center:**
   - Challenge Track: *"Agents, your rules: Bedrock Managed Agents build"*.
   - Copy the submission writeup from `docs/hackathon/HACKATHON_SUBMISSION.md`.
   - Include GitHub repository link and public video demo link.
