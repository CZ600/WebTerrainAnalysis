import numpy as np
from tifffile import imread, imwrite
from osgeo import gdal


def align_images(image1, image2, image3):
    # 读取图像
    img1 = imread(image1)
    img2 = imread(image2)
    img3 = imread(image3)

    # 获取图像的地理坐标信息
    dataset1 = gdal.Open(image1)
    geotransform1 = dataset1.GetGeoTransform()
    dataset2 = gdal.Open(image2)
    geotransform2 = dataset2.GetGeoTransform()
    dataset3 = gdal.Open(image3)
    geotransform3 = dataset3.GetGeoTransform()

    # 计算平移量
    dx2 = int((geotransform1[0] - geotransform2[0]) / geotransform2[1])
    dy2 = int((geotransform1[3] - geotransform2[3]) / geotransform2[5])

    dx3 = int((geotransform1[0] - geotransform3[0]) / geotransform3[1])
    dy3 = int((geotransform1[3] - geotransform3[3]) / geotransform3[5])

    # 对齐图像
    aligned_img2 = np.roll(img2, shift=(dy2, dx2), axis=(0, 1))
    aligned_img3 = np.roll(img3, shift=(dy3, dx3), axis=(0, 1))

    # 拼接图像
    result = np.dstack((img1, aligned_img2, aligned_img3))

    return result


# 使用示例
image1 = 'path/to/image1.tif'
image2 = 'path/to/image2.tif'
image3 = 'path/to/image3.tif'
result0 = align_images(image1, image2, image3)
imwrite('result.tif', result0)