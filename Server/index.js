/*
 *  created by tsengkasing ar 2016/12/29
 */

var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    fs = require('fs'),
    splitFile = require('split-file'),
    client = require('scp2'),
    url = require('url'),
    querystring = require('querystring'),
    httpProxy = require('http-proxy'),
    SFTPClient = require('sftp-promises');
//var Client = require('scp2').Client;
var BLOCK_SIZE = 2 * 1024 * 1024;

const OUTPUT_FOLDER = './page/public/';

const MASTER_HOSTNAME = 'novemser.vicp.io';
const MASTER_PORT = 521;

const SLAVE = {
    '192.168.52.132': 7000,
    '192.168.52.133': 7001,
    '192.168.52.134': 7002,
    '192.168.52.139': 7003,
    '192.168.52.140': 7004
};

const API = {
    AllFiles: '/api/files',
    FileInfo: '/api/file/',
    UploadFile: '/api/upload',
    VerifyFile: '/api/verify/',
    NodeStatus: '/api/slave/status',
    RenameFile: '/api/rename',
    deleteFile: '/api/delete'
};

var file_list = [];

//===============================================================
//函数

function getAllFilesInfo() {
    var receiveData = '';
    const opts = {
        hostname: MASTER_HOSTNAME,
        path: API.AllFiles,
        method: 'GET',
        port: MASTER_PORT
    };
    var req = http.request(opts, function(res) {
        //console.log(`STATUS: ${res.statusCode}`);
        //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            receiveData += chunk;
            //console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            receiveData = JSON.parse(receiveData);
            console.log('[INFO] [MASTER] File List');
            //console.log(receiveData);
            file_list = receiveData;
        });
    });
    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    req.end();
}

function requestVerifyFile(file_id, callback) {
    var receiveData = '';
    const opts = {
        hostname: MASTER_HOSTNAME,
        path: API.VerifyFile + file_id,
        method: 'GET',
        port: MASTER_PORT
    };
    var req = http.request(opts, function(res) {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            receiveData += chunk;
        });
        res.on('end', () => {
            receiveData = JSON.parse(receiveData);
            console.log('[INFO] [MASTER] Verify File' + receiveData);
            if (res.statusCode == 200)
                callback();
        });
    });
    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    req.end();
}

function requestDeleteFile(file_id, callback) {
    var receiveData = '';
    const opts = {
        hostname: MASTER_HOSTNAME,
        path: API.deleteFile,
        method: 'POST',
        port: MASTER_PORT,
        headers: {
            'content-type': 'application/json'
        }
    };
    var req = http.request(opts, function(res) {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            receiveData += chunk;
        });
        res.on('end', () => {
            receiveData = JSON.parse(receiveData);
            console.log('[INFO] [MASTER] Delete File' + receiveData);
            if (receiveData.status == 'OK')
                callback();
        });
    });
    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    req.write(JSON.stringify({ fileId: file_id }));
    req.end();
}

function requestNodeStatus(callback) {
    var receiveData = '';
    const opts = {
        hostname: MASTER_HOSTNAME,
        path: API.NodeStatus,
        method: 'GET',
        port: MASTER_PORT
    };
    var req = http.request(opts, function(res) {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            receiveData += chunk;
        });
        res.on('end', () => {
            receiveData = JSON.parse(receiveData);
            console.log('[INFO] [MASTER] NodeStatus ' + receiveData);
            if (res.statusCode == 200)
                callback(receiveData);
        });
    });
    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    req.end();
}

//检查布尔数组是否全为true
function checkArray(arr) {
    var uploaded = true;
    for (var i = 0; i < arr.length; i++) {
        uploaded &= arr[i];
    }
    return uploaded;
}

//解析文件大小 byte
function parseFileSize(size) {
    const Bytes = size % 1024;
    const KBytes = parseInt((size / 1024) % 1024, 10);
    const MBytes = parseInt((size / 1024 / 1024) % 1024, 10);
    const GBytes = parseInt((size / 1024 / 1024 / 1024), 10);
    if (size >= 1024) {
        if (size / 1024 > 1024) {
            if (size / 1024 / 1024 > 1024) {
                return GBytes + ' GB';
            } else
                return MBytes + ' MB';
        } else
            return KBytes + ' KB';
    } else
        return size + ' Bytes';
}

//=========================================================================


//=================================================================
//Initial Start

//从Master获取所有文件信息
getAllFilesInfo();

//Initial End
//==============================================================


var server = http.createServer(function(req, res) {

    var URL = url.parse(req.url);
    var pathName = URL.pathname;
    console.log('[INFO] 请求路径 ' + pathName);

    switch (pathName) {
        case '/api/upload':
            if (req.method.toLowerCase() == 'post') {
                // parse a file upload 
                var form = new formidable.IncomingForm();
                form.encoding = 'utf-8'; //设置编辑
                form.uploadDir = './temp'; //设置上传目录
                form.keepExtensions = true; //保留后缀
                form.type = true;

                //标识合法文件  
                var valid = true;

                form.on('end', function() {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    var result = true;
                    res.end(JSON.stringify(result));
                });

                form.parse(req, function(err, fields, files) {});

                form.on('progress', function(bytesReceived, bytesExpected) {
                    //console.log('[INFO] File Receiving Progress : ' + bytesReceived + ' bytes /' + bytesExpected + ' bytes');
                    console.log('[INFO] File Receiving Progress : ' + parseInt(bytesReceived / bytesExpected * 100, 10) + '%');
                });

                form.on('fileBegin', function(name, file) {
                    valid = true;
                    console.log('[INFO] File Stream Begin');

                    for (var i = 0; i < file_list.length; i++) {
                        if (file_list[i].fileName == file.name) {
                            form.emit('aborted', 'Duplicated File Name');
                            console.log('[INFO] Duplicated File Name');
                            //重名 不合法
                            valid = false;
                        }
                    }
                    console.log('[INFO] File Will Save At ' + file.path);
                });

                form.on('file', function(name, file) {
                    //如果不合法
                    if (!valid) {
                        res.writeHead(200, { 'content-type': 'application/json' });
                        var result = false;
                        res.end(JSON.stringify(result));
                        return;
                    }

                    if (file.size <= BLOCK_SIZE) {
                        console.log('[INFO] 文件小于' + (BLOCK_SIZE / 1024 / 1024).toFixed(0) + 'M 无需分割');
                        var uploaded = [false, false, false];

                        const postData = {
                            name: file.name,
                            fileSize: file.size,
                            blockSize: 64,
                            blockNum: 1
                        };
                        var info = '';
                        const opts = {
                            hostname: MASTER_HOSTNAME,
                            path: API.UploadFile,
                            method: 'POST',
                            port: MASTER_PORT,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };
                        var req = http.request(opts, function(res) {
                            res.setEncoding('utf8');
                            res.on('data', (chunk) => { info += chunk; });
                            res.on('end', () => {
                                var Client = require('scp2').Client;
                                info = JSON.parse(info);
                                console.log('[INFO] [MASTER] Slave Target');
                                //console.log(info);
                                const blocks = info.block1;

                                for (var i = 0; i < 3; i++) {

                                    console.log('[INFO] 开始上传第' + i + '份');

                                    const key = i;

                                    var _client = new Client({
                                        port: SLAVE[blocks[key].slaveIP],
                                        host: MASTER_HOSTNAME,
                                        username: blocks[key].username,
                                        password: blocks[key].password,
                                    });
                                    _client.upload(file.path, blocks[key].absPath,
                                        function(err) {
                                            if (err) {
                                                console.log('[ERROR] 第' + (key + 1) + '份 上传失败');
                                                console.log(err);
                                            } else {
                                                console.log('[INFO] 第' + (key + 1) + '份 上传完成');
                                                uploaded[key] = true;
                                                if (checkArray(uploaded)) {
                                                    requestVerifyFile(info.fileId, () => {
                                                        console.log('[INFO] Delete Temp File');
                                                        fs.unlinkSync(file.path); //删除本地缓存文件
                                                    });
                                                }
                                            }
                                        });
                                }


                            });
                        });
                        req.on('error', (e) => {
                            console.log(`problem with request: ${e.message}`);
                        });
                        req.write(JSON.stringify(postData));
                        req.end();
                    } else {
                        console.log('[INFO] 开始分割');
                        splitFile.splitFileBySize(file.path, BLOCK_SIZE, function(err, names) {
                            if (err) {
                                console.log('[ERROR] 文件分割失败');
                                console.log(err);
                                return;
                            } else console.log(names);
                            console.log('[INFO] 分割完成 共 ' + names.length + ' 份');

                            var file_path = [];

                            //记录每个冗余文件每个部分上传成功状态
                            var uploaded = [];
                            for (var k = 0; k < 3; k++) {
                                var redundant = [];
                                for (var j = 0; j < names.length; j++) {
                                    redundant.push(false);
                                }
                                uploaded.push(redundant);
                            }

                            const postData = {
                                name: file.name,
                                fileSize: file.size,
                                blockSize: 64,
                                blockNum: names.length
                            };
                            var info = '';
                            const opts = {
                                hostname: MASTER_HOSTNAME,
                                path: API.UploadFile,
                                method: 'POST',
                                port: MASTER_PORT,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            };
                            var req = http.request(opts, function(_res) {
                                var Client = require('scp2').Client;
                                _res.setEncoding('utf8');
                                _res.on('data', (chunk) => { info += chunk; });
                                _res.on('end', () => {
                                    info = JSON.parse(info);
                                    console.log('[INFO] [MASTER] Slave Target');
                                    console.log('[INFO] FileID' + info.fileId);

                                    for (var j = 0; j < names.length; j++) {

                                        const part = j + 1;
                                        const block = info['block' + part];
                                        //console.log(block);

                                        for (var i = 0; i < 3; i++) {

                                            const key = i;
                                            var _client = new Client({
                                                port: SLAVE[block[key].slaveIP],
                                                host: MASTER_HOSTNAME,
                                                username: block[key].username,
                                                password: block[key].password,
                                            });

                                            console.log('[INFO] 正在上传第 ' + (key + 1) + ' 份的 ' + part + ' 部分');

                                            _client.upload(names[j], block[key].absPath,
                                                function(err) {
                                                    if (err) {
                                                        console.log('[ERROR] 第 ' + (key + 1) + ' 份的第 ' + part + ' 部分 上传失败');
                                                        console.log(err);
                                                    } else {
                                                        console.log('[INFO] 第 ' + (key + 1) + ' 份的第 ' + part + ' 部分 上传完成');
                                                        uploaded[key][part - 1] = true;
                                                        if (checkArray(uploaded[0]) && checkArray(uploaded[1]) && checkArray(uploaded[2])) {
                                                            requestVerifyFile(info.fileId, () => {
                                                                console.log('[INFO] Delete Temp File');
                                                                for (var k = 0; k < names.length; k++) {
                                                                    fs.unlinkSync(names[k]); //删除本地缓存分割文件
                                                                }
                                                                fs.unlinkSync(file.path); //删除本地缓存文件
                                                            });

                                                        }
                                                    }
                                                });

                                        }
                                    }

                                });
                            });
                            req.on('error', (e) => {
                                console.log(`problem with request: ${e.message}`);
                            });
                            req.write(JSON.stringify(postData));
                            req.end();
                        });
                    }
                });
            }
            break;
        case '/api/download':
            {
                var params = querystring.parse(URL.query);
                console.log('[INFO] Download FileID : ' + params.id);
                var fileId = params.id;
                var file = '';

                const opts = {
                    hostname: MASTER_HOSTNAME,
                    path: API.FileInfo + fileId,
                    method: 'GET',
                    port: MASTER_PORT
                };
                var req = http.request(opts, function(_res) {
                    _res.setEncoding('utf8');
                    _res.on('data', (chunk) => {
                        file += chunk;
                    });
                    _res.on('end', () => {
                        file = (JSON.parse(file)).file;
                        console.log('[INFO] [MASTER] File');
                        //console.log(file);
                        const blocks = file.downloadBlocks;

                        if (file.realBlockCount == 1) {
                            const key = 0;
                            client.scp({
                                    //host: slaveIP,
                                    host: MASTER_HOSTNAME,
                                    username: blocks[key].username,
                                    password: blocks[key].password,
                                    path: blocks[key].absPath,
                                    port: SLAVE[blocks[key].slaveIP]
                                },
                                OUTPUT_FOLDER + file.fileName,
                                function(err) {
                                    if (err) console.log(err);
                                    else {
                                        status = true;
                                        res.writeHead(200, { 'content-type': 'text/plain' });
                                        res.end('http://localhost:6740/public/' + file.fileName);
                                    }
                                });
                        } else {
                            var block = [];
                            var downloaded = [];
                            var j = 0;
                            for (var i = 0; i < file.realBlockCount; i++) {
                                block.push('./temp/' + blocks[i].blockName);
                            }

                            //console.log(block);
                            for (var k = 0; k < file.realBlockCount; k++) {
                                const key = k;
                                client.scp({
                                    //host: slaveIP,
                                    host: MASTER_HOSTNAME,
                                    username: blocks[key].username,
                                    password: blocks[key].password,
                                    path: blocks[key].absPath,
                                    port: SLAVE[blocks[key].slaveIP]
                                }, block[key], function(err) {
                                    if (err) {
                                        console.log('[ERROR] 文件第 ' + (key + 1) + ' 部分下载失败');
                                        console.log(err);
                                    } else {
                                        downloaded[key] = true;
                                        if (checkArray(downloaded)) {
                                            splitFile.mergeFiles(block, OUTPUT_FOLDER + file.fileName, function(err, filename) {
                                                if (err) {
                                                    console.log('[ERROR] 文件合并失败');
                                                    console.log(err);
                                                    return;
                                                }
                                                console.log('[INFO] 合并成功 文件路径: ' + filename);
                                                for (var c = 0; c < block.length; c++) {
                                                    fs.unlinkSync(block[c]); //删除本地缓存分割文件
                                                }
                                                res.writeHead(200, { 'content-type': 'text/plain' });
                                                res.end('http://localhost:6740/public/' + file.fileName);
                                            });
                                        }
                                    }
                                });
                            }
                        }

                    });
                });
                req.on('error', (e) => {
                    console.log(`problem with request: ${e.message}`);
                });
                req.end();
            }
            break;
        case '/api/refresh':
            {
                getAllFilesInfo();

                var file_list_simple = file_list.map((file) => ({
                    id: file.fileId,
                    name: file.fileName,
                    size: parseFileSize(file.fileSize),
                    uploadTime: new Date(file.createTime).toLocaleString()
                }));
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify(file_list_simple));
            }
            break;
        case '/api/delete':
            {
                var fileId;
                var postData = '';
                req.on("data", function(data) {
                    postData += data
                });

                req.on("end", function() {
                    fileId = JSON.parse(postData).id;
                    var receiveData = '';
                    const opts = {
                        hostname: MASTER_HOSTNAME,
                        path: API.FileInfo + fileId,
                        method: 'GET',
                        port: MASTER_PORT
                    };
                    var req = http.request(opts, function(_res) {
                        _res.setEncoding('utf8');
                        _res.on('data', (chunk) => {
                            receiveData += chunk;
                        });
                        _res.on('end', () => {
                            receiveData = JSON.parse(receiveData);
                            console.log('[INFO] [MASTER] File');
                            //console.log(receiveData);
                            var deleted = [];

                            const blocks = receiveData.file.allFileBlocks;
                            //console.log(blocks);

                            for (var i = 0; i < blocks.length; i++) {
                                const key = i;
                                deleted.push(false);
                                var config = {
                                    //host: blocks[key],
                                    host: MASTER_HOSTNAME,
                                    port: SLAVE[blocks[key].block.slaveIP],
                                    username: blocks[key].block.username,
                                    password: blocks[key].block.password
                                };
                                var sftp = new SFTPClient(config);
                                sftp.rm(blocks[key].block.absPath)
                                    .then((success) => {
                                        console.log('[INFO] 删除第 ' + key + ' 份冗余成功');
                                        deleted[key] = true;
                                        if(checkArray(deleted)) {
                                            requestDeleteFile(fileId, () => {
                                                res.writeHead(200, { 'content-type': 'application/json' });
                                                res.end(JSON.stringify(true));
                                            });
                                        }
                                    }, (error) => {
                                        console.log('[ERROR] 文件不存在');
                                        res.writeHead(200, { 'content-type': 'application/json' });
                                        res.end(JSON.stringify(false));
                                    });
                            }

                        });
                    });
                    req.on('error', (e) => {
                        console.log(`problem with request: ${e.message}`);
                    });
                    req.end();
                });
            }
            break;
        case '/api/rename':
            {
                var file = '';
                var postData = '';

                req.on("data", function(data) {
                    postData += data
                });

                req.on("end", function() {
                    info = JSON.parse(postData);
                    const fileId = info.id;
                    const fileName = info.name;
                    var receiveData = '';
                    const opts = {
                        hostname: MASTER_HOSTNAME,
                        path: API.RenameFile,
                        method: 'POST',
                        port: MASTER_PORT,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };
                    var req = http.request(opts, function(_res) {
                        _res.setEncoding('utf8');
                        _res.on('data', (chunk) => {
                            receiveData += chunk;
                        });
                        _res.on('end', () => {
                            receiveData = JSON.parse(receiveData);
                            console.log('[INFO] [MASTER] Rename Status'+ receiveData);
                            res.writeHead(200, { 'content-type': 'application/json' });
                            if (receiveData.status == 'OK') {
                                res.end(JSON.stringify(true));
                            } else {
                                res.end(JSON.stringify(false));
                            }
                        });
                    });
                    req.on('error', (e) => {
                        console.log(`problem with request: ${e.message}`);
                    });
                    req.write(JSON.stringify({ fileId: fileId, fileName: fileName }));
                    req.end();
                });

            }
            break;
            case '/api/blocksize' : {
                var params = querystring.parse(URL.query);
                console.log('[INFO] Set Block Size : ' + params.size);
                BLOCK_SIZE = parseInt(params.size, 10) * 1024 * 1024;
                console.log('[INFO] Block Size : ' + BLOCK_SIZE);
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify(true));
            }break;
            case '/api/node' : {

                requestNodeStatus((receiveData) => {
                    var status = [];
                    for(var slave in receiveData) {
                        status.push(receiveData[slave]);
                    }
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(status));
                });


            }break;
    }

});
console.log('[INFO] Background Server listening on port 4708');
server.listen(4708);

//=============================================================================================
//以下是代理服务器

// 新建一个代理 Proxy Server 对象  
var proxy = httpProxy.createProxyServer({});

// 捕获异常  
proxy.on('error', function(err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    res.end('Something went wrong. And we are reporting a custom error message.');
});

// 另外新建一个 HTTP 80 端口的服务器，也就是常规 Node 创建 HTTP 服务器的方法。  
// 在每次请求中，调用 proxy.web(req, res config) 方法进行请求分发  
var ProxyServer = http.createServer(function(req, res) {
    // 在这里可以自定义你的路由分发  
    var pathName = url.parse(req.url).pathname;
    var host = req.headers.host,
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var target = 'page';

    if (/\/api.*$/.test(pathName)) {
        target = "api";
    }

    console.log("[INFO] [Proxy Server] client ip:" + ip + ", host:" + host + ", target:" + target + " url: " + pathName);

    if (target == 'api') {
        proxy.web(req, res, { target: 'http://localhost:4708' });
    } else {
        proxy.web(req, res, { target: 'http://localhost:3000' });
    }
});

console.log("[INFO] Web Server listening on port 6740");
console.log("[INFO] Proxy Server listening on port 4312");
ProxyServer.listen(4312);
