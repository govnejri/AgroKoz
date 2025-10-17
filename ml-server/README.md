# 🐍 AgroKoz ML Server

FastAPI сервер для YOLOv8 inference с PyTorch моделью.

## Установка

```bash
# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt
```

## Запуск

```bash
# Активировать окружение
source venv/bin/activate

# Запустить сервер
python server.py
```

Сервер будет доступен на `http://localhost:8000`

## API Endpoints

### GET /
Информация о сервере

### GET /health
Проверка работоспособности

### POST /predict
Анализ изображения

**Parameters:**
- `file`: изображение (multipart/form-data)
- `confidence`: порог уверенности (optional, default=0.5)

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "healthy seed",
      "confidence": 0.95,
      "bbox": {
        "x": 100,
        "y": 150,
        "width": 50,
        "height": 60
      }
    }
  ],
  "statistics": {
    "healthy_count": 10,
    "bad_count": 5,
    "impurity_count": 2,
    "total_count": 17
  }
}
```

## Тестирование

```bash
# С помощью curl
curl -X POST "http://localhost:8000/predict" \
  -F "file=@/path/to/image.jpg" \
  -F "confidence=0.5"
```

## Интеграция с React Native

В MLService.ts используйте fetch для отправки изображения:

```typescript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg',
});

const response = await fetch('http://YOUR_IP:8000/predict', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

## Документация API

Swagger UI доступен на: `http://localhost:8000/docs`
