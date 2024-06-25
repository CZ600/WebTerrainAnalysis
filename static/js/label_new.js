const canvasWidth = 1300
const canvasHeight = 1000
let canvas_background_url = "/static/喜马拉雅山.jpg"
// 绑定按钮
let button_line = document.getElementById("line");
let button_point = document.getElementById("point");
let button_rectangle = document.getElementById("rectangle");
let button_clean = document.getElementById("clean");
let button_save_file = document.getElementById("output-button");
let button_start_dot = document.getElementById("start_dot")
let button_clean_dot = document.getElementById("clean_dot")
let button_true_dot = document.getElementById("true_dot")
let button_false_dot = document.getElementById("false_dot")
let button_Prompt_segmentation = document.getElementById("submit_dot")
let button_auto_seg = document.getElementById("auto-button")
// 获取 canvas 元素
const canvas = document.getElementById('myCanvas');
// 获取绘图上下文
const ctx = canvas.getContext('2d');
let shape = 'point'; // 'point', 'line', 或 'rectangle'
let points = []; // 存储折线点
let value = 1; // 判断正负点
var Drawing = false  // 判断是否在绘图
var Dotting = false // 是否在进行提示点的标记


// 切换绘图状态
button_start_dot.addEventListener('click', () => {
  if(Dotting === false){
    Dotting = true
    button_start_dot.innerText = "结束标记"
  }else if(Dotting === true){
    Dotting = false
    button_start_dot.innerText = "开始标记"
  }
})

// 正负点切换
button_true_dot.addEventListener('click', () => {
  value = 1
})

button_false_dot.addEventListener('click', () => {
  value = 0
})

// 鼠标按下事件
canvas.addEventListener('mousedown', (e) => {

  const x = e.offsetX;
  const y = e.offsetY;

  if (e.button === 0 && Dotting === false) {
    console.log("isDrawing:", Drawing);
    if (shape === 'point') {
      // 直接画点
      drawPoint(ctx, x, y,color='red');
    } else if (shape === 'rectangle') {
      rectStart = { x: e.offsetX, y: e.offsetY };
      Drawing = true;
    } else if (shape === 'line') {
      var point = { x: e.offsetX, y: e.offsetY };  // 绘制点
      if (Drawing === false){
        // 如果没有开始绘制，则向数组中添加新的点
        Drawing = true;
        points = [point];
        console.log("points:",points);
      } else if(Drawing===true){
        // 如果已经开始绘制，则添加新的点
        console.log("new line point:",point);
        points.push(point);
         // draw the line
        drawLine(points);
      }
    }
    console.log("down!")
  }else if(e.button === 0 && Dotting === true){
    console.log("Dotting:",Dotting)

    data = {
      "point_x":x,
      "point_y":y,
      "value":value
    }
    if(value ===1){
      drawPoint(ctx, x, y,color='red')
    }else if(value ===0){
      drawPoint(ctx, x, y,color='blue')
    }
     fetch('/dot', {
          method: 'POST', // 指定请求方法为POST
          headers: {
            'Content-Type': 'application/json' // 设置请求头
          },
          body: JSON.stringify(data) // 将数据转换为JSON字符串
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // 解析JSON格式的响应数据
        })
        .then(data => {
          console.log('Response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
  }
});

// 鼠标松开事件
canvas.addEventListener('mouseup', (e) => {
  if (Drawing === true && Dotting === false)  {
    if(e.button ==0){
      if (shape === 'rectangle') {
        rectSize = {
          width: e.offsetX - rectStart.x,
          height: e.offsetY - rectStart.y
        }
        // 绘制最终的矩形
        ctx.strokeRect(rectStart.x, rectStart.y, rectSize.width, rectSize.height);
        // 结束绘制
        Drawing = false;
      } 
    }else if (e.button===2 && Dotting === false) {
      if(shape === 'line'){
        // 结束绘制
        console.log('line end')
        let label = prompt("请输入对象标签类别：");
        let data = {
          "label": label,
          "points": points
        }
        console.log(data)
        // 发送HTTP POST请求
        fetch('/label_restore', {
          method: 'POST', // 指定请求方法为POST
          headers: {
            'Content-Type': 'application/json' // 设置请求头
          },
          body: JSON.stringify(data) // 将数据转换为JSON字符串
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // 解析JSON格式的响应数据
        })
        .then(data => {
          console.log('Response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
        points = []
        Drawing = false;
      }
      
    }
  }
  isDrawing = false;
});

// 禁止右键菜单的默认行为
canvas.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});
// 绘制点
function drawPoint(ctx, x, y,color="blue") {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// 绘制折线函数
function drawLine(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (var i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = 'red'
  ctx.stroke();

}

// 绘制矩形
function drawRectangle(ctx, x, y) {
  ctx.rect(0, 0, x, y);
  ctx.stroke();
}

function changeShape(newShape) {
  if (newShape === "line") {
    shape = 'line';
  } else if (newShape === "rectangle") {
    shape = 'rectangle';
  } else if (newShape === "point") {
    shape = 'point';
  }
}

button_point.addEventListener("click", () => {
  changeShape("point")
})
button_line.addEventListener("click", () => {
  changeShape("line")
})
button_rectangle.addEventListener("click", () => {
  changeShape("rectangle")
})
function clean() {
  let canvas = document.getElementById("myCanvas");
  let context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  let background = new Image();
  background.src = canvas_background_url;
  background.onload = function () {
    context.drawImage(background, 0, 0);
  };
  console.log("clean!")
}
function clean_all() {
  let canvas = document.getElementById("myCanvas");
  let context = canvas.getContext("2d");
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  console.log("clean all ")
}

button_clean.addEventListener("click", () => {
  clean()
})
// set the background image
// 改变图像
function changeImage(url, imageId) {
  let canvas = document.getElementById("myCanvas");
  let context = canvas.getContext("2d");
  clean_all()
  canvas_background_url = url
  let background = new Image();
  background.src = canvas_background_url;
  background.onload = function () {
    context.drawImage(background, 0, 0);
  };
}

window.onload = function () {
  let canvas = document.getElementById("myCanvas");
  let context = canvas.getContext("2d");

  let background = new Image();
  background.src = "/static/喜马拉雅山.jpg";

  background.onload = function () {
    context.drawImage(background, 0, 0);
  };
};

function uploadFile(imageId, uploadForm) {
  let image_input = document.getElementById(uploadForm);
  let file = image_input.files[0];
  const formData = new FormData();
  formData.append('file', file)
  fetch('/upload_RGB', {
    method: 'POST',
    body: formData
  }).then(response => {
    if (!response.ok) {
      throw new Error('Error uploading file');
    }
    return response.json(); // 解析JSON响应
  }).then(data => {
    // 服务器返回的JSON对象包含一个'url'键
    let imageUrl = data.url; // 从JSON对象中获取URL
    let location = data.location
    imageLocation = location
    console.log(imageUrl);
    changeImage(imageUrl, imageId)
    console.log('File uploaded successfully');
    console.log(location)

  }).catch(error => {
    console.log('Error:', error);
  });
}

let uploadButton4 = document.getElementById("upload4");
// 实现上传按钮
uploadButton4.addEventListener("click", function () {
  uploadFile("clickable-image", "imageInputRgb")
})


button_save_file.addEventListener("click", () => {
  const downloadUrl = '/save_label';
  fetch(downloadUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob();
    })
    .then(blob => {
        // 创建一个链接元素用于下载
        const a = document.createElement('a');
        // 创建一个blob URL
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'file.txt';  // 设定下载的文件名
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });

})


button_Prompt_segmentation.addEventListener('click', () => {
  data = {'image_url':canvas_background_url}
  fetch('/finish_sending_points', {
          method: 'POST', // 指定请求方法为POST
          headers: {
            'Content-Type': 'application/json' // 设置请求头
          },
          body: JSON.stringify(data) // 将数据转换为JSON字符串
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // 解析JSON格式的响应数据
        })
        .then(data => {
          console.log('Response image path:', data);
          changeImage(data['path'],"1111");
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
})

button_auto_seg.addEventListener('click', () => {
  data = {'image_url':canvas_background_url}
  fetch('/auto_signal', {
          method: 'POST', // 指定请求方法为POST
          headers: {
            'Content-Type': 'application/json' // 设置请求头
          },
          body: JSON.stringify(data) // 将数据转换为JSON字符串
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // 解析JSON格式的响应数据
        })
        .then(data => {
          console.log('Response image path:', data);
          changeImage(data['path'],"1111");
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
})
// 清除标签点
button_clean_dot.addEventListener('click', () => {
  clean()
  console.log("clean!")
  data = {}
  fetch('/dot_clean', {
          method: 'POST', // 指定请求方法为POST
          headers: {
            'Content-Type': 'application/json' // 设置请求头
          },
          body: JSON.stringify(data) // 将数据转换为JSON字符串
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // 解析JSON格式的响应数据
        })
        .then(data => {
          console.log('Response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
})
