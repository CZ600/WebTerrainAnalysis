// 存放地理位置坐标数据
var imageLocation = []

// 定义地图控件
let overviewMapControl = new ol.control.OverviewMap({
      className: 'ol-overviewmap ol-custom-overviewmap',
      layers: [
        new ol.layer.Tile({
          // 使用高德
         source: new ol.source.XYZ({
                        url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}&lang=zh_cn&scl=1&sv=7&key=ce2bc8663af5253256250118e9455e5a',

                        crossOrigin: 'anonymous',
                        attributions: '© 高德地图'
                    })
        })

      ],
      collapsed: false
    });

// 定义一个ol地图
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}&lang=zh_cn&scl=1&sv=7&key=ce2bc8663af5253256250118e9455e5a', // 高德地图矢量图源URL
                crossOrigin: 'anonymous',
                attributions: '© 高德地图'
            })
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([116.391275, 39.90765]), // 北京的经纬度坐标
        projection: 'EPSG:3857',
        zoom: 10 // 地图的初始缩放级别
    }),
    // 添加控件
   controls: ol.control.defaults.defaults({
        // 在默认控件的基础上添加自定义控件
        attributionOptions: {
            collapsible: false
        }
    }).extend([
        // 添加比例尺控件
        new ol.control.ScaleLine(),
        // 添加缩放滑块控件
        new ol.control.ZoomSlider(),
        // 添加全屏控件
        new ol.control.FullScreen(),
        overviewMapControl
    ])
});

// 修改图像,显示图像
function uploadImage(url,imageId){
    var img = document.getElementById(imageId);
    var imgSrc = img.getAttribute('src');
    img.src = url;

};

// 显示range的实时数字
document.addEventListener('DOMContentLoaded', function() {
  var range = document.getElementById('high_k');
  var valueDisplay = document.getElementById('rangeValue_high');
  range.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});
document.addEventListener('DOMContentLoaded', function() {
  var range = document.getElementById('low_k');
  var valueDisplay = document.getElementById('rangeValue_low');
  range.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});
document.addEventListener('DOMContentLoaded', function() {
  var range = document.getElementById('mid_k');
  var valueDisplay = document.getElementById('rangeValue_mid');
  range.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});
document.addEventListener('DOMContentLoaded', function() {
  var range = document.getElementById('log_k');
  var valueDisplay = document.getElementById('rangeValue_log');
  range.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});
document.addEventListener('DOMContentLoaded', function() {
  var range = document.getElementById('gamma_k');
  var valueDisplay = document.getElementById('rangeValue_gamma');
  range.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});


// 将元素添加到处理流程中并在容器中显示
var listProcess = Array();
var processValue = Array()
function addBadge(processName,value= 0) {
  var badgeContainer = document.getElementById("processStream");
  listProcess.push(processName)
    processValue.push(value)
  // 创建一个新的徽章
  var newBadge = document.createElement('div');
  newBadge.className = "badge rounded-pill bg-secondary";
  newBadge.textContent = processName;

  // 将徽章添加到徽章容器中
  badgeContainer.appendChild(newBadge);
  console.log(listProcess)

}

function uploadFile() {
      var formData = new FormData(document.getElementById('uploadForm'));
      fetch('/upload', {
        method: 'POST',
        body: formData
      }).then(response => {
        if (!response.ok) {
          throw new Error('Error uploading file');
        }
        return response.json(); // 解析JSON响应
      }).then(data => {
        // 服务器返回的JSON对象包含一个'url'键
          var imageUrl = data.url; // 从JSON对象中获取URL
          var location = data.location
          imageLocation = location
          console.log(imageUrl);
          raw_png_location = imageUrl
        //var extent = ol.proj.transformExtent([73, 12.2, 135, 54.2], 'EPSG:4326', 'EPSG:3857');
          //var extent = location
          uploadImage(imageUrl, 'rawImage')
        map.addLayer(
          new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: imageUrl,
                projection: 'EPSG:3857',
                imageExtent: location //映射到地图的范围
            })
          })
        )
        console.log('File uploaded successfully');
        console.log(location)

        // 设置地图的中心点
        var newCenter= [location[0], location[1]]; // 将经纬度转换为地图的投影坐标系
        console.log(newCenter)
        // 更新地图的中心
        map.getView().setCenter(newCenter);
      }).catch(error => {
        console.log('Error:', error);
      });
      // 获取地图的所有图层
        var layers = map.getLayers();
        // 获取图层集合中的图层数量
        var numberOfLayers = layers.getLength();

    }


// 开始图像处理流程
const startProcess = async function (processList, valueList, imageUrl) {
    // 存放数据
     const data = {
        processList: processList,
        paramenters: valueList,
        rawUrl: imageUrl
    };
    try {
        const response = await fetch("/preprocessing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Received data:", result);
        // 在这里处理返回的图片地址，例如将其设置为某个元素的src属性
        resultimage = document.getElementById("resultImage")
        resultimage.src = result.resultUrl;
        return result.resultUrl

    }catch (error) {
        console.error("Error calling submitData:", error);
        return "error"
    }

};
// 开始图像处理
function replaceFileExtension(url, newExtension) {
    // 使用正则表达式找到文件扩展名并替换它
    const newUrl = url.replace(/\.[^\.]+$/, `.${newExtension}`);
    return newUrl;
}

button_start_imageProcess = document.getElementById("startImageProcess")
button_start_imageProcess.addEventListener("click", function () {
    procedure = document.getElementById("procedure")
    rawPng = document.getElementById("rawImage")
    rawUrlPng = rawPng.src
    rawUrlTif = replaceFileExtension(rawUrlPng, "tif")
    console.log(rawUrlTif)
    const myPromise = new Promise((resolve, reject) => {
    // 异步操作
        console.log("开始处理图像");
        startProcess(listProcess, processValue, rawUrlTif)
    });
    myPromise.then(result => {
            console.log(result); // 输出result
        }).catch(error => {
            console.log(error);
        });
})


// 实现树状结构管理图层
function getTree() {
  // Some logic to retrieve, or generate tree structure
        var tree = [
      {
        text: "底图图层",
        icon: "fa fa-folder",
        expanded: true,
        nodes: [
          {
            text: "高德地图",
            icon: "fa fa-folder",
            nodes: [
              {
                id:    "sub-node-1",
                text:  "Sub Child Node 1",
                icon:  "fa fa-folder",
                class: "nav-level-3",
                  layer: new ol.layer.Tile({
                      source:new ol.source.XYZ({
                            url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}&lang=zh_cn&scl=1&sv=7&key=ce2bc8663af5253256250118e9455e5a', // 高德地图矢量图源URL
                            crossOrigin: 'anonymous',
                            attributions: '© 高德地图'
                      })
                  }),
                  state: { checked: true}  // 默认选中
              },
              {
                id:"sub-node-2",
                text: "osm地图",
                icon: "fa fa-folder",
                class: "nav-level-3",
                  layer: new ol.layer.Tile({
                        source: new ol.source.OSM()
                    }),
                    state: { checked: false } // 默认no

              }
            ]
          },
          {
            text: "osm",
             icon: "fa fa-folder"
          }
        ]
      },
      {
        text: "数据图层",
        icon: "fa fa-folder"
      },
    ];
  return tree;
}

$('#tree').bstreeview({ data: getTree() });

// 将预处理完成后的图像显示到地图上
display_button = document.getElementById("display_preProcess_image");
display_button.addEventListener("click", function(){
    const resultImage = document.getElementById("resultImage");
    const imageUrl = resultImage.src;
    console.log('图像地址：', imageUrl);
    // 添加新图层
    const imageLayer_P = new ol.layer.Image({
        source: new ol.source.ImageStatic({
            url: imageUrl,
            projection: 'EPSG:3857',
            imageExtent: imageLocation
        })
    });
    map.addLayer(imageLayer_P);

});

// 智能处理部分
// fetch 异步提交表单数据
async function textProcess(string, url) {
  // 构建请求选项
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ string: string, url: url }) // 将字符串和图像地址转换为JSON格式的字符串
  };

  try {
    // 使用fetch发送请求
    const response = await fetch('/semantic_analysis', options);
    // 确保响应状态码是OK的
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 解析JSON响应
    const result = await response.json();
    // 打印处理后的字符串
    console.log(result.resultUrl);
    // 返回处理后的字符串
    return {"resultUrl":result.resultUrl,"process":result.process,"parameters":result.parameters};
  } catch (error) {
    // 处理错误
    console.error('Error sending string to backend:', error);
    throw error;
  }
}

// 请对该图像进行一次卷积核大小为5的高通滤波，然后进行一次线性拉伸,然后再进行一次卷积核为3的低通滤波
// 监听按钮的点击事件
document.addEventListener('DOMContentLoaded', (event) => {
  // 确保DOM完全加载后再获取元素和添加事件监听器
  const loadButton = document.getElementById('textSubmit');
  loadButton.addEventListener('click', function() {
  let textarea = document.getElementById("floatingTextarea2");
  let text = textarea.value;
  console.log('Text content:', text);
  let url = document.getElementById("rawImage").src;
  let tifUrl = replaceFileExtension(url, 'tif')
  // 加载图案显示
  //const spinner = document.getElementById('spinner1');
  // 调用函数并传递一个字符串
  textProcess(text, tifUrl).then(result => {
      let resultUrl = result.resultUrl
      let operations = result.process
      let params = result.parameters
      console.log('Process:', operations)
      console.log('Parameters:', params)
      console.log('Processed string:', resultUrl);
      uploadImage(resultUrl, 'resultImage');
      //spinner.style.display = 'none'; // 加载完成后隐藏图案
      let tableBody  = document.getElementById("myTable")
      operations.forEach((operation, index) => {
            const row = document.createElement("tr");
            const cellOperation = document.createElement("td");
            const cellParam = document.createElement("td");

            cellOperation.textContent = operation;
            cellParam.textContent = params[index];

            row.appendChild(cellOperation);
            row.appendChild(cellParam);
            tableBody.appendChild(row);
        });


      }).catch(error => {
        console.error('Error sending string to backend:', error);
        //spinner.style.display = 'none'; // 加载完成后隐藏图案
      });
    });
});



