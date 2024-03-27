# 导入必要的库函数
import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator, SamPredictor


# 定义可视化函数
def show_mask(mask, ax, random_color=False):
    if random_color:
        color = np.concatenate([np.random.random(3), np.array([0.6])], axis=0)
    else:
        color = np.array([30 / 255, 144 / 255, 255 / 255, 0.6])
    h, w = mask.shape[-2:]
    mask_image = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
    ax.imshow(mask_image)


def show_points(coords, labels, ax, marker_size=375):
    pos_points = coords[labels == 1]
    neg_points = coords[labels == 0]
    ax.scatter(pos_points[:, 0], pos_points[:, 1], color='green', marker='*', s=marker_size, edgecolor='white',
               linewidth=1.25)
    ax.scatter(neg_points[:, 0], neg_points[:, 1], color='red', marker='*', s=marker_size, edgecolor='white',
               linewidth=1.25)


def sam_point_split(image_pth, point_list, label_list):
    """
    适用于取点分割
    """
    # 显示一个机场的影像
    # image = cv2.imread('./test/test.jpg')
    image = cv2.imread(image_pth)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # input_point = [[161.68633534, 72.98191204], [877.04076261, 201.13987133]]
    input_point = point_list
    input_point = np.array(input_point)
    '''例如[[161.68633534,72.98191204],[877.04076261,201.13987133]]'''
    # input_label = [1, 1]
    input_label = label_list
    input_label = np.array(input_label)
    '''例如[0,1]，0为负类，1为正类'''
    # load模型文件，定义预测模型为Sampredictor即交互式预测
    sam_checkpoint = "./weights/sam_vit_h_4b8939.pth"
    model_type = "vit_h"  # sam

    """
    sam_checkpoint = "./weights/mobile_sam.pt"
    model_type = "vit_t" # mobile_sam
    """

    device = "cuda" if torch.cuda.is_available() else "cpu"
    sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
    sam.to(device=device)
    predictor = SamPredictor(sam)
    predictor.set_image(image)  # embedding操作
    # 预测效率较高v100显卡大概3s完成预测
    masks, scores, logits = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True, )

    plt.figure(figsize=(20, 15))

    for i, (mask, score) in enumerate(zip(masks, scores)):
        plt.subplot(1, 3, i + 1)
        plt.imshow(image)
        show_mask(mask, plt.gca())
        show_points(input_point, input_label, plt.gca())
        plt.title(f"Mask {i + 1}, Score: {score:.3f}", fontsize=18)
        plt.axis('off')
    plt.show()


# 实例分割的掩膜是由多个多边形组成的，可以通过下面的函数将掩膜显示在图片上
def show_anns(anns):
    if len(anns) == 0:
        return
    sorted_anns = sorted(anns, key=(lambda x: x['area']), reverse=True)
    ax = plt.gca()
    ax.set_autoscale_on(False)
    polygons = []
    color = []
    for ann in sorted_anns:
        m = ann['segmentation']
        img = np.ones((m.shape[0], m.shape[1], 3))
        color_mask = np.random.random((1, 3)).tolist()[0]
        for i in range(3):
            img[:, :, i] = color_mask[i]
        ax.imshow(np.dstack((img, m * 0.35)))


def sam_atuo_split(image_pth):
    """
    适用于自主分割
    """
    image = cv2.imread(image_pth)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    sam_checkpoint = "./weights/sam_vit_h_4b8939.pth"
    model_type = "vit_h"  # sam
    sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
    sam.to(device=device)
    mask_generator = SamAutomaticMaskGenerator(sam)
    masks = mask_generator.generate(image)

    # 此时masks包含多种信息，segmentation', 'area', 'bbox', 'predicted_iou', 'point_coords', 'stability_score',
    # 'crop_box'分别代表掩膜文件、多边形、坐标框、iou、采样点、得分、裁剪框
    print(len(masks))  # 多边形个数，数值越大，分割粒度越小
    print(masks[0].keys())

    plt.figure(figsize=(10, 10))
    plt.imshow(image)
    show_anns(masks)  # 显示过程较慢
    plt.show()