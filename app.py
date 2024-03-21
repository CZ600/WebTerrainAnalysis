from flask import Flask, request, send_file, jsonify
import flask
from flask_bootstrap import Bootstrap5
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from image_process import image_load
from image_process import process
from dashscope.api_entities.dashscope_response import Role
from wsgiref.simple_server import make_server
from chat import call_with_prompt
import json
from chatglm import chatGLM

# sk-ac7bd32e53284528855a5f03347a4e7c

app = Flask(__name__)
bootstrap = Bootstrap5(app)

# 路由
''' 页面管理 '''


# 首页
@app.route('/', methods=['GET', 'POST'])
def index():  # put application's code here
    return flask.render_template('index.html')


# 地图页面
@app.route("/map", methods=['GET', 'POST'])
@cross_origin("*")  # 允许跨域请求
def map():
    return flask.render_template("map.html")


# 智能问答界面
# 存储对话历史的列表


@app.route("/chat", methods=['GET', 'POST'])
@cross_origin("*")
def chat():
    return flask.render_template("chat.html")


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


# 处理大模型对话请求
conversation_history = [{'role': Role.SYSTEM,
                         'content': 'If any questions are asked about identity, remember who you are: you are a big model of artificial intelligence focused on solving problems in the geographic sciences. '
                                    'You will answer questions about geography objectively and scientifically.'}]


# 语义解析
@app.route("/semantic_analysis", methods=['POST'])
def semantic_analysis():
    # 导入预设参数
    # 分解用户输入
    user_input = request.json
    print(user_input)
    # 错误处理
    if not user_input:
        return jsonify({'error': 'No input provided'}), 400
    url = user_input["url"]
    text = user_input["string"]

    # 合成用户的输入信息
    user_message = {'role': 'user', 'content': text}
    # 调用大模型进行对话
    result = chatGLM(user_message)
    print(result)
    # 解析大模型的回答
    parts = None
    result = result[1:-1]  # 去除外围大括号
    if "], [" in result:
        parts = result.split("], [")
    elif "],[" in result:
        parts = result.split("],[")
    print("parts:", parts)
    list1_str = parts[0][1:]  # 去除开始的括号
    list2_str = parts[1][:-1]  # 去除尾部的 bracket
    list1 = list1_str.split(",")
    list2 = [int(item) for item in list2_str.split(",")]
    print("list1:", list1, "\n list2:", list2)
    # 处理图像
    result_url = process(list1, list2, url)
    return jsonify({'resultUrl': result_url, "process": list1, "parameters": list2})


@app.route("/chatbot", methods=['POST'])
@cross_origin("*")
def chatbot():
    user_input = request.json.get('input')
    if not user_input:
        return jsonify({'error': 'No input provided'}), 400
    # 合成用户的输入信息
    user_message = {'role': Role.USER, 'content': user_input}
    print("user input:   ", user_message)
    # 将用户输入添加到对话历史
    global conversation_history
    conversation_history.append(user_message)
    print("history before:  ", conversation_history)

    output_message, conversation_history = call_with_prompt(conversation_history)
    # 将API回复添加到对话历史
    print("history after:  ", conversation_history)
    # 返回API回复
    return jsonify({'response': output_message})


# 获取客户端的ip地址
@app.route("/get_ip", methods=['GET'])
@cross_origin("*")
def get_ip():
    ip = request.host_url
    print("ip:", ip)
    return jsonify({'ip': ip})


# 启动Flask应用程序
CORS(app)
app.config['DEBUG'] = True

if __name__ == '__main__':
    server = make_server('0.0.0.0', 5000, app)
    server.serve_forever()
    app.run()
