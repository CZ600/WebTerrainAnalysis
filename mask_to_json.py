import cv2
import os
import json


def func(file: str) -> dict:
    png = cv2.imread(file)
    gray = cv2.cvtColor(png, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    dic = {
        "version": "5.0.1",
        "flags": {},
        "shapes": [],
        "imagePath": os.path.basename(file),
        "imageHeight": png.shape[0],
        "imageWidth": png.shape[1]
    }
    for contour in contours:
        temp = []
        for point in contour[2:]:
            if len(temp) > 1 and temp[-2][0] * temp[-2][1] * int(point[0][0]) * int(point[0][1]) != 0 and (
                    (int(point[0][0]) - temp[-2][0]) * (temp[-1][1] - temp[-2][1]) == (
                    int(point[0][1]) - temp[-2][1]) * (temp[-1][0] - temp[-1][0])):
                temp[-1][0] = int(point[0][0])
                temp[-1][1] = int(point[0][1])
            else:
                temp.append([int(point[0][0]), int(point[0][1])])
        dic["shapes"].append({
            "label": "result",
            "points": temp,
            "group_id": None,
            "shape_type": "polygon",
            "flags": {}
        })

    return dic


def process_files(input_path: str, output_path: str):
    if os.path.isdir(input_path):
        for file in os.listdir(input_path):
            file_path = os.path.join(input_path, file)
            if os.path.isfile(file_path):
                with open(os.path.join(output_path, os.path.splitext(file)[0] + ".json"), mode='w',
                          encoding="utf-8") as f:
                    json.dump(func(file_path), f)
    else:
        with open(os.path.join(output_path, os.path.splitext(os.path.basename(input_path))[0] + ".json"), mode='w',
                  encoding="utf-8") as f:
            json.dump(func(input_path), f)


if __name__ == "__main__":
    input_path = "json/picture"  # Replace with your input path
    output_path = "json/json_data"  # Replace with your output path

    if not os.path.exists(output_path):
        os.makedirs(output_path)

    process_files(input_path, output_path)