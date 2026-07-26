@echo off
echo Starting local server for 3D House Viewer...
echo Open http://localhost:8000 in your browser
echo Press Ctrl+C to stop
echo.
python -m http.server 8000
