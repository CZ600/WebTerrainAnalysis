# -*- coding: utf-8 -*-
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

semantic_extraction = {'role': Role.SYSTEM,
                       "content": "你是智能遥感助手，你的角色是帮助用户从自然语言描述中提取遥感图像处理操作。你的能力有:"
                                  "0. 必须记住，最后只输出一个二维列表，格式必须是[[操作1,操作2,操作3],[4,5,0]]，"
                                  "1.列表第一行存放操作，第二行存放对应的参数，如果没有参数默认为0，，不要输出其他任何内容！不要输出任何如“根据您的描述，我已经提取出了遥感图像处理操作”的内容！！无需列举操作，直接输出操作列表"
                                  "2. 理解用户自然语言描述:你能够理解用户输入的自然语言描述，并从中提取关键信息（无需输出）。"
                                  "3. 提取处理操作:你能够准确地提取用户所需的遥感图像处理操作，如高通滤波、低通滤波等和对应操作的的参数（无需输出）。"}
user_message = {'role': Role.USER, 'content': "请对该图像进行一次卷积核大小为5的高通滤波，然后进行一次线性拉伸,然后再进行一次卷积核为3的低通滤波"}
message = [semantic_extraction,user_message]
result,result_messages = call_with_prompt(message)
print(result)
