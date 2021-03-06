#!/usr/bin/env python

from flask import Flask, request, abort, redirect

app = Flask(__name__)

@app.route('/')
def home():
    return 'Got r00t? Sounds g00d!'

@app.route('/broken404/', defaults={'param': ''})
@app.route('/broken404/<param>')
def broken404(param):
    return 'I answer with 200 to everything!'

@app.route('/mangling/')
@app.route('/mangling/foo')
@app.route('/mangling/.foo.swp')
@app.route('/mangling/.bar.swp')
@app.route('/mangling/.qux.swp')
def mangling():
    return 'Mangling is useful'

@app.route('/mangling/qux')
def mangling_redirect():
    return redirect('/mangling/qux2')

@app.route('/header-req')
def header_req():
    if request.headers.get('X-Files') == 'TrustNo1':
        return 'The truth is out there'
    else:
        abort(404)

@app.route('/auth')
def auth():
    a = request.authorization
    if a and a.username == "foo" and a.password == "bar":
        return 'Welcome'
    else:
        abort(401)

@app.route('/postfix/bar.html')
def postfix():
    return '<html><body>Welcome to the bar!</body></html>'

if __name__ == '__main__':
    app.run()
