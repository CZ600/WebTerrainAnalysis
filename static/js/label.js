// 获取图像元素
let isSendingCoordinates = true; // 初始状态允许发送坐标
let label = 1; // 默认为1

function createDot(event) {
    // 获取鼠标点击位置相对于容器的像素坐标
    var container = document.getElementById("container");
    var containerRect = container.getBoundingClientRect();
    var x = event.clientX - containerRect.left;
    var y = event.clientY - containerRect.top;


    // 获取背景图片的尺寸
    var backgroundImage = new Image();
    backgroundImage.src = 'data:image/jpeg;base64,{{ encoded_image }}';
    var backgroundWidth = backgroundImage.width;
    var backgroundHeight = backgroundImage.height;

    // 将点击点的像素坐标转换为相对于背景图片的像素坐标
    var backgroundX = Math.round((x / containerRect.width) * backgroundWidth);
    var backgroundY = Math.round((y / containerRect.height) * backgroundHeight);

    // 创建一个 div 元素作为圆点
    var dot = document.createElement("div");
    dot.style.position = "absolute";
    dot.style.left = (x - 5) + "px"; // 使圆点的中心位于点击位置
    dot.style.top = (y - 5) + "px";
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "50%";

    // 根据label值设置点的颜色
    if (label == 1) {
        dot.style.backgroundColor = "red";
    } else {
        dot.style.backgroundColor = "green";
    }

    // 将圆点添加到容器中
    container.appendChild(dot);

    // 发送点击坐标到后端
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/get_pixel_coordinates");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({ point_x: backgroundX, point_y: backgroundY }));
}

$(document).ready(function() {

    // 设置容器的背景图片及尺寸
    var backgroundImage = new Image();
    backgroundImage.src = '/static/喜马拉雅山.jpg';
    backgroundImage.onload = function() {
        var container = document.getElementById("container");
        container.style.backgroundImage = 'url(' + backgroundImage.src + ')';
        container.style.width = backgroundImage.width + 'px';
        container.style.height = backgroundImage.height + 'px';
    };

    // 添加点击事件监听器
    backgroundImage.addEventListener('click', function(event) {
        if (isSendingCoordinates) {
            // 发送坐标到后端
            $.ajax({
                type: 'POST',
                url: '/get_pixel_coordinates',
                data: JSON.stringify({ point_x: x, point_y: y }),
                contentType: 'application/json',
                success: function(response) {
                    console.log("Coordinates sent successfully.");
                },
                error: function(xhr, status, error) {
                    console.error("Error sending coordinates:", error);
                }
            });
        }
    }, false);

    // 添加停止发送坐标按钮的点击事件监听器
    $('#coordinates-button').on('click', function() {
        isSendingCoordinates = false;
        stopSendingCoordinates();
    });

    // 添加发送整数按钮的点击事件监听器
    $('#send-int').on('click', function() {
        var value = $(this).data('value');
        sendIntValue(value);
    });

    // 添加自动按钮的点击事件监听器
    $('#auto-button').on('click', function() {
        sendAutoSignal();
    });

    function stopSendingCoordinates() {
        let image = document.getElementById("clickable-image")
        let image_url = image.src
        $.ajax({
            type: 'POST',
            url: '/finish_sending_points',
            data: JSON.stringify({ image_url: image_url }), // 发送图像URL到后端
            contentType: 'application/json', // 指定内容类型为JSON
            success: function(response) {
                console.log("Finish signal sent successfully.");
                // 可选地，隐藏或禁用按钮，防止重复发送
                $('#coordinates-button').hide();
                // 假设response中包含了新的图像URL
                console.log(response.path)
                image.src = response.path; // 更新图像元素的src属性为新URL
                // 显示按钮
                setTimeout(function() {
                    $('#coordinates-button').show();
                    isSendingCoordinates = true; // 设置为true，以便再次发送坐标
                }, 5000); // 5秒后显示按钮
            },
            error: function(xhr, status, error) {
                console.error("Error sending finish signal:", error);
            }
        });
    }

    function sendIntValue(value) {
        $.ajax({
            type: 'POST',
            url: '/send_int_value',
            data: JSON.stringify({ value: value }),
            contentType: 'application/json',
            success: function(response) {
                console.log("Integer value sent successfully.");
            },
            error: function(xhr, status, error) {
                console.error("Error sending integer value:", error);
            }
        });
    }

    function sendAutoSignal() {
        let image = document.getElementById("clickable-image")
        let image_url = image.src
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ image_url: image_url }), // 发送图像URL到后端
            url: '/auto_signal',
            success: function(response) {
                console.log("Finish signal sent successfully.");
                // 可选地，隐藏或禁用按钮，防止重复发送
                $('#coordinates-button').hide();
                // 假设response中包含了新的图像URL
                console.log(response.path)
                image.src = response.path; // 更新图像元素的src属性为新URL
                // 显示按钮
                setTimeout(function() {
                    $('#coordinates-button').show();
                    isSendingCoordinates = true; // 设置为true，以便再次发送坐标
                }, 5000); // 5秒后显示按钮
            },
            error: function(xhr, status, error) {
                console.error("Error sending finish signal:", error);
                // 可以考虑在这里添加用户反馈
            }
        });
    }
});

uploadButton4 = document.getElementById("upload4")
// 改变图像
function changeImage(url,imageId){
    const img = document.getElementById(imageId);
    console.log(img)
    img.src = url;
}
// 上传图像
function uploadFile(imageId,uploadForm) {
      let image_input = document.getElementById(uploadForm);
      let file = image_input.files[0];
      const formData = new FormData();
      formData.append('file',file)
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
// 实现上传按钮
uploadButton4.addEventListener("click", function(){
    uploadFile("clickable-image","imageInputRgb")
})