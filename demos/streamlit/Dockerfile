# Streamlit + Altair.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
COPY .streamlit ./.streamlit
COPY data/gapminder.csv data/world.geojson ./data/
RUN useradd --create-home app
USER app

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "exec streamlit run app.py --server.address=0.0.0.0 --server.port=${PORT}"]
