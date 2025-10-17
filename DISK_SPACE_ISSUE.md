# ⚠️ Недостаточно Места на Диске

## Проблема
Диск заполнен на 99% (осталось только 3.7 GB из 294 GB)

## Что Делать

### Вариант 1: Очистка Временных Файлов

```bash
# Очистите кеш npm
npm cache clean --force

# Очистите кеш apt
sudo apt clean
sudo apt autoclean
sudo apt autoremove

# Очистите старые журналы
sudo journalctl --vacuum-time=3d

# Удалите временные файлы
rm -rf ~/.cache/*
rm -rf /tmp/*
```

### Вариант 2: Найдите Большие Файлы

```bash
# Найдите самые большие директории
du -h ~ | sort -rh | head -20

# Или используйте ncdu (если установлен)
sudo apt install ncdu
ncdu ~
```

### Вариант 3: Очистка Docker (если используете)

```bash
# Удалите неиспользуемые контейнеры
docker system prune -a
```

### Вариант 4: Удалите node_modules из старых проектов

```bash
# Найдите все node_modules
find ~ -name "node_modules" -type d -prune

# Удалите ненужные (ОСТОРОЖНО!)
# Например:
# rm -rf ~/old-project/node_modules
```

---

## После Очистки

Когда освободите хотя бы 10-15 GB, можно продолжить:

```bash
cd /home/beka/Desktop/argohack/AgroKozExpo
npx expo install expo-camera expo-sqlite expo-file-system expo-sharing
npm install @react-navigation/native @react-navigation/bottom-tabs
```

---

## Альтернатива: Используйте Оригинальный Проект

Если очистка диска займет много времени, вы можете:

1. Установить только Android Studio (займет ~3-4 GB)
2. Использовать физическое устройство
3. Запустить оригинальное React Native приложение

**Оригинальный проект AgroKoz уже готов и ждет только Android SDK!**

---

## Быстрая Проверка Места

```bash
# Проверьте место
df -h

# Узнайте что занимает место
du -sh ~/.cache ~/.npm ~/Android ~/Downloads
```

Рекомендую освободить хотя бы 20 GB для комфортной работы.
