from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

ENGLISH_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
ENGLISH_LOWER = "abcdefghijklmnopqrstuvwxyz"
HINDI = "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह"


def shift_from_alphabet(char, shift, alphabet):
    index = alphabet.find(char)

    if index == -1:
        return None

    return alphabet[(index + shift) % len(alphabet)]


def caesar_cipher(text, shift, mode="encrypt", language="auto"):
    """Encrypt or decrypt text with the Caesar Cipher algorithm."""
    if mode == "decrypt":
        shift = -shift

    result = ""

    for char in text:
        shifted_char = None

        if language in ("auto", "english"):
            shifted_char = shift_from_alphabet(char, shift, ENGLISH_UPPER)
            shifted_char = shifted_char or shift_from_alphabet(char, shift, ENGLISH_LOWER)

        if shifted_char is None and language in ("auto", "hindi"):
            shifted_char = shift_from_alphabet(char, shift, HINDI)

        result += shifted_char if shifted_char is not None else char

    return result


def parse_payload():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    language = data.get("language", "auto")

    try:
        shift = int(data.get("shift", 0))
    except (TypeError, ValueError):
        return None, jsonify({"error": "Shift must be a whole number."}), 400

    if shift < 0 or shift > 25:
        return None, jsonify({"error": "Shift must be between 0 and 25."}), 400

    if language not in ("auto", "english", "hindi"):
        return None, jsonify({"error": "Unsupported language selected."}), 400

    return {"text": text, "shift": shift, "language": language}, None, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/encrypt", methods=["POST"])
def encrypt():
    payload, error_response, status = parse_payload()

    if error_response:
        return error_response, status

    result = caesar_cipher(
        payload["text"],
        payload["shift"],
        "encrypt",
        payload["language"],
    )
    return jsonify({"result": result})


@app.route("/decrypt", methods=["POST"])
def decrypt():
    payload, error_response, status = parse_payload()

    if error_response:
        return error_response, status

    result = caesar_cipher(
        payload["text"],
        payload["shift"],
        "decrypt",
        payload["language"],
    )
    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(debug=True)
