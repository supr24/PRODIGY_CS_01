# Caesar Cipher Studio

A full-stack Python project with a Flask backend and a modern HTML/CSS/JavaScript
frontend for encrypting and decrypting text using the Caesar Cipher algorithm.

## How It Works

1. The user enters a message.
2. The user chooses a shift value from 0 to 25.
3. For encryption, each letter moves forward by the shift value.
4. For decryption, each letter moves backward by the same shift value.
5. Non-letter characters, such as spaces, punctuation, and numbers, are kept unchanged.
6. The alphabet wraps around, so shifting `Z` by 1 becomes `A`.

## Project Structure

```text
app.py
templates/
  index.html
static/
  style.css
  script.js
requirements.txt
caesar_cipher.py
```

## Run the Flask App

```bash
pip install -r requirements.txt
python app.py
```

Then open:

```text
http://localhost:5000
```

## Run the Console Program

```bash
python caesar_cipher.py
```

Example:

```text
Enter your message: Hello
Enter shift value (0-25): 3
Choose mode (encrypt/decrypt): encrypt

Result: Khoor
```
