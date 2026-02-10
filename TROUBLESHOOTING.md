# Troubleshooting

## Ollama connection issues

- Confirm Ollama is running: `ollama serve`
- Verify a model is installed: `ollama list`
- Check the endpoint: http://localhost:11434
- Restart the app after starting Ollama

## Self-learning not working

- Ensure `userData/selflearn_config.json` has `enabled: true`
- Verify `watchPaths` exist and are readable
- Check `maxFilesPerScan` is greater than zero
- Reduce the scan rate if the system is under heavy load

## Code sandbox errors

- If the editor does not load, restart the app to refresh the renderer
- Reinstall dependencies:
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install`
- Validate the build pipeline: `npm run build`

## General diagnostics

- Open DevTools with `F12` and check the console for errors
- Review logs in `userData/logs/` if available
- Run `npm run dev:electron` from a terminal to capture stack traces
