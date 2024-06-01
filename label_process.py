import json
import re

data = {
    "version": "4.4.0",
    "flags": {},
    "shapes": [],
    "imagePath": "",
    "imageData": ""  # 这里应该是实际图片的base64编码
}
class Object:
    def __init__(self,name, points):
        self.content = {
            "label": name,
            "points": points,
            "group_id": "null",
            "description": "",
            "shape_type": "polygon",
            "flags": {},
            "mask": "null"
        }
        self.points = []

    # 添加标签
    def label(self, name):
        self.content["label"] = name

    # 添加点集合
    def points(self, points):
        self.content["points"] = points

    # 添加点
    def add_point(self, point):
        self.content["points"].append(point)

    # 添加描述
    def __str__(self):
        return json.dumps(self.content)

    # 输出
    def __repr__(self):
        return str(json.dumps(self.content))
# 向数据集合中添加元素
def add_data(shape:Object):
    data["shapes"].append(shape.content)


