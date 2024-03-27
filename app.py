from flask import Flask, request, send_file, jsonify
import flask
from flask_bootstrap import Bootstrap5
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from image_process import *
from dashscope.api_entities.dashscope_response import Role
from wsgiref.simple_server import make_server
from chat import call_with_prompt
import json
from chatglm import chatGLM
from image_merge import align_images
from osgeo import gdal
from X import predict, see_RGB
import re

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


# 地貌识别页面
@app.route("/recognition", methods=['GET', 'POST'])
@cross_origin("*")
def recognition():
    return flask.render_template("multimoding.html")


# 多模态识别页面
@app.route("/multimoding_page", methods=['GET', 'POST'])
@cross_origin("*")
def multimoding_page():
    return flask.render_template("multimoding.html")


# 土地利用分类页面
@app.route("/land_classification", methods=['GET', 'POST'])
@cross_origin("*")
def land_classification():
    return flask.render_template("land_classification.html")


@app.route('/analysis', methods=['GET', 'POST'])
@cross_origin("*")
def analysis():
    return flask.render_template("analysis.html")

# sam标注界面
@app.route("/label", methods=['GET', 'POST'])
@cross_origin("*")
def label():
    return flask.render_template("label.html")

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


@app.route("/upload_RGB", methods=['POST'])
@cross_origin("*")
def upload_RGB():
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
            img_url = image_load_RGB(file)

            return jsonify({'url': img_url})

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


@app.route("/multimoding", methods=['GET', "POST"])
@cross_origin("*")
def multimoding():
    image_url1 = request.json.get('near-infrared')
    image_url2 = request.json.get("DEMImage")
    image_url3 = request.json.get("slopeImage")
    # 合成影像
    print(image_url1)
    m_image_name = align_images(image_url1, image_url2, image_url3)
    print("merge_image:", m_image_name)
    # 对图像进行识别
    # 获取识别图像
    temp_url = predict.split_and_reconstruct(m_image_name, (512, 512), 512, 'attention_unet')
    predict_image = request.host_url + temp_url
    classes = ["background", "lake", "vally"]
    colormap = [[0, 0, 0], [192, 64, 128], [255, 255, 255]]
    predict_dict = sum_rgb(classes, colormap, temp_url)
    return jsonify({'resultUrl': predict_image, "sum_dict": predict_dict})


@app.route("/classify", methods=['GET', "POST"])
@cross_origin("*")
def classify():
    image_url = request.json.get("imageUrl")
    print("imageUrl:", image_url)
    base_url = re.sub(r'http://127.0.0.1:8000/', '', image_url)
    print("loacal:", base_url)
    classes = ["None", "Background", "Building", "Road", "Water", "Barren", "Forest", "Agriculture"]
    colormap = [[0, 0, 0], [255, 255, 255], [180, 30, 30], [100, 100, 100], [0, 0, 255], [220, 220, 220],
                [34, 139, 34], [255, 215, 0]]
    temp_url = see_RGB.split_and_reconstruct_rgb(base_url, (512, 512), 128, 'unet_x')
    predict_image = request.host_url + temp_url
    result_dict = sum_rgb(classes, colormap, temp_url)  # 统计预测结果图像的数据分布方法
    return jsonify({'resultUrl': predict_image, "sum_dict": result_dict})


@app.route("/overlayAnalysis", methods=['GET', "POST"])
@cross_origin("*")
def overlayAnalysis():
    multimoding_url = request.json.get("multimodingUrl")
    classify_url = request.json.get("classifyUrl")
    multimoding_url = re.sub(r'http://127.0.0.1:8000/', '', multimoding_url)
    classify_url = re.sub(r'http://127.0.0.1:8000/', '', classify_url)
    print("multimoding_url:", multimoding_url, "classify_url:", classify_url)
    return_url = overlay_analysis(multimoding_url, classify_url)
    result_path = request.host_url + return_url
    classes = ["不适宜开发", "水体", "已经建设利用土地", "未知", "可开发土地", "其他"]
    colormap = [[255, 0, 0], [128, 64,192 ], [30, 30, 180], [0, 0, 0], [220, 220, 220], [203, 192,255 ]]
    class_count = sum_rgb(classes, colormap, return_url)
    return jsonify({'resultUrl': result_path, "class_count": class_count})


# 启动Flask应用程序
CORS(app)
app.config['DEBUG'] = True

if __name__ == '__main__':
    server = make_server('0.0.0.0', 5000, app)
    server.serve_forever()
    app.run()
