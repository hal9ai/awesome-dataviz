# Flask + matplotlib, served by gunicorn.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MPLCONFIGDIR=/tmp/matplotlib
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
COPY templates ./templates
COPY data/gapminder.csv data/world.geojson ./data/
USER nobody

ENV PORT=8080
EXPOSE 8080
# Two workers: one can draw while the other answers.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 60 app:app"]
