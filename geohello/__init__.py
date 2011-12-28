from flask import Flask, render_template

app = Flask(__name__)
app.secret_key = 'foo'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stream')
def stream():
    return render_template('stream/stream.html')

@app.route('/info/about')
def about():
    return render_template('info/about.html')

@app.route('/info/privacy')
def privacy():
    return render_template('info/privacy.html')