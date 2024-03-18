from flask import Flask, request, send_file, jsonify
import flask
from flask_bootstrap import Bootstrap5
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from image_process import image_load
from image_process import process

app = Flask(__name__)
bootstrap = Bootstrap5(app)

# 路由
''' 页面管理 '''

# 首页
@app.route('/')
def index():  # put application's code here
    return flask.render_template('index.html')


# 地图页面
@app.route("/map", methods=['GET', 'POST'])
@cross_origin("*")  # 允许跨域请求
def map():
    return flask.render_template("map.html")


# 顶部导航栏
@app.route("/header")
def header():
    return flask.render_template("header.html")


''' 请求处理 '''


# 处理图像上传请求
@app.route("/upload", methods=['POST'])
@cross_origin("*")  # 允许跨域请求
def upload():
    try:
        if 'file' not in request.files:
            return 'No file part', 400
        file = request.files['file']
        if file.filename == '':
            return 'No selected file', 400
        if file:
            # 读取tif文件
            file = request.files['file']
            # 调用图像处理函数处理,获取图像的url和图像的坐标数据
            img_url, location_data = image_load(file)

            return jsonify({'url': img_url, 'location': location_data})

    except Exception as e:
        print(e)
        return 'Internal server error', 500


# 处理图像预处理请求
@app.route("/preprocessing", methods=['GET', 'POST'])
@cross_origin("*")  # 允许跨域请求
def preprocessing():
    try:
        if request.json is None:
            return 'No data part', 400
        elif request.json:
            data = request.json
            print(data)
            result = process(data['processList'], data['paramenters'], data['rawUrl'])
            print(result)
            return jsonify({'resultUrl': result})
    except Exception as e:
        print(e)
        return 'Internal server error', 500


if __name__ == '__main__':
    app.run()


def fun():
    pass
