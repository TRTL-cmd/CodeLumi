# Lumi Known Issues (Beta)

- Suggestion JSON parsing can fail when the model output is not valid JSON.
- Metrics can briefly show zero immediately after KB writes until the next poll.
- Windows packaging can fail due to file locks in `release/`; delete the folder and retry.

If you find a new issue, add it here with:
- Summary
- Steps to reproduce
- Expected vs actual behavior
- Logs (from Export Logs)
