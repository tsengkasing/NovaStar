import React from 'react';
import './App.css';
import {Card, CardActions} from 'material-ui/Card';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import LinearProgress from 'material-ui/LinearProgress';
import ActionBackup from 'material-ui/svg-icons/action/backup';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionBuild from 'material-ui/svg-icons/action/build';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import FileFolderOpen from 'material-ui/svg-icons/file/folder-open';
import FileFileDownload from 'material-ui/svg-icons/file/file-download';
import {red500, greenA200} from 'material-ui/styles/colors';
import ImageLens from 'material-ui/svg-icons/image/lens';
import FileCloudCircle from 'material-ui/svg-icons/file/cloud-circle';
import CircularProgress from 'material-ui/CircularProgress';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Subheader from 'material-ui/Subheader';
import Dialog from 'material-ui/Dialog';
import 'jquery-form';
import $ from 'jquery';

const styles = {
    card : {
        margin : '0 auto',
        maxWidth : '1024px',
        padding : '32px 0',
    },
    table : {
        overflowX : 'scroll',
        overflowY : 'hidden',
        background : 'transparent',
    },
    tableBody : {
        overflowX : 'auto',
        overflowY : 'hidden',
    },
    tableRightColumn : {
        textAlign : 'right'
    },
    button: {
        margin: 12,
    },
    fileInput: {
        cursor: 'pointer',
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        width: '100%',
        opacity: 0,
    },
    circularProgress : {
        textAlign : 'center',
    },
    iconStyles : {
        marginLeft : 8,
        marginRight: 24,
        verticalAlign : 'bottom',
    },
    slaveStatus : {
        display : 'inline-block',
        textAlign : 'center',

    },

};

const URL = '/api';

const API = {
    Upload : URL + '/upload',
    Refresh : URL + '/refresh',
    Download : URL + '/download',
    Delete : URL + '/delete',
    Rename : URL + '/rename',
    NodeStatus : URL + '/node',
    BlockSize : URL + '/blocksize',
};

let sample = [
    {
        id : -1,
        name : 'a.txt',
        size : '2KB',
        uploadTime : '2016-12-29 18:56:00',
    },
];
for(let i = 0; i < 5; i++) {
    let d = new Date();
    sample.push({
        id : i,
        name : (Math.random() * 20).toFixed(0) + '.txt',
        size : (Math.random() * 256).toFixed(0) + 'MB',
        uploadTime : d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(),
    });
}

class DeleteFileDialog extends React.Component {
    state = {
        open: false,
        fileId : null,
    };

    handleOpen = (fileId) => {
        this.setState({
            open: true,
            fileId : fileId,
            progress : false,
        });
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleSubmit = () => {
        const data = {id : this.state.fileId};
        $.ajax({
            url : API.Delete,
            type : 'POST',
            data : JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                this.props.onSuccess();
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
        this.setState({
            progress : true,
        });
    };

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                style={{display : this.state.progress ? 'none' : 'inline-block'}}
                onTouchTap={this.handleClose}
            />,
            <FlatButton
                label="Submit"
                primary={true}
                style={{display : this.state.progress ? 'none' : 'inline-block'}}
                onTouchTap={this.handleSubmit}
            />,
        ];

        return (
            <div>
                <Dialog
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={()=>{if(!this.state.progress) this.handleClose()}}
                >
                    {this.state.progress ? <div style={styles.circularProgress} ><CircularProgress /></div> : '删除文件？'}
                </Dialog>
            </div>
        );
    }
}

class RenameFileDialog extends React.Component {
    state = {
        open: false,
        fileId : null,
        filename : null,
    };

    handleOpen = (fileId, fileName) => {
        this.setState({
            open: true,
            fileId : fileId,
            filename : fileName
        });
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleChange = (event) => {
        this.setState({
            filename: event.target.value,
        });
    };

    handleSubmit = () => {
        const data = {id : this.state.fileId, name : this.state.filename};
        $.ajax({
            url : API.Rename,
            type : 'POST',
            data : JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                this.setState({open: false});
                this.props.onSuccess();
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });


    };

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
            <FlatButton
                label="Submit"
                primary={true}
                onTouchTap={this.handleSubmit}
            />,
        ];

        return (
            <div>
                <Dialog
                    title="重命名文件"
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >

                    <TextField
                        onChange={this.handleChange}
                        value={this.state.filename}
                        hintText="新文件名"
                        floatingLabelText="文件名"
                    /><br />
                </Dialog>
            </div>
        );
    }
}

class UploadFileDialog extends React.Component {
    state = {
        open: false,
    };

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleSubmit = () => {
        var form = $('#uploadFileForm').ajaxSubmit();
        var xhr = form.data('jqxhr');

        xhr.done(function(data) {
            console.log(data);
            if(!data) alert('Duplicated File Name');
            setTimeout(this.props.onSuccess, 5000);
        }.bind(this));
        //var submit = $('#submitBtn');
        //submit.click();
        this.setState({open: false});
        this.props.onUpload();
    };

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
            <FlatButton
                label="Submit"
                primary={true}
                onTouchTap={this.handleSubmit}
            />,
        ];

        return (
            <div>
                <Dialog
                    title="上传文件"
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >
                    <form id="uploadFileForm" encType="multipart/form-data" method="post" action={API.Upload} target="uploadFrame">
                        <RaisedButton
                            label="选择一个文件"
                            style={styles.button}
                            containerElement="label"
                            primary={true}
                            icon={<FileFolderOpen/>}
                        >
                            <input type="file" style={styles.fileInput} name="file"/>
                        </RaisedButton>
                        <input type="submit" id="submitBtn" style={{display:'none'}} />
                    </form>
                </Dialog>
            </div>
        );
    }
}


class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            disablePreviousButton : true,
            disableNextButton : true,

            pages_num : 1,
            current_page : 1,
            current_list : [],

            file_list : [],
            progress : false,
            blockSize : 64,

            slaves : [true, true, false, false, true],
            used_space : 14,
            capacity : 256,
        };
    }

    getNodeStatus = () => {
        $.ajax({
            url : API.NodeStatus,
            type : 'GET',
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                this.setState({slaves : data});
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
        setTimeout(this.getNodeStatus, 10000);
    };

    getFileList = () => {
        $.ajax({
            url : API.Refresh,
            type : 'GET',
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                let current_list = data.slice(0, 10);
                let pages_num = parseInt((data.length / 10), 10) + ((data.length % 10 > 0) ? 1 : 0);
                this.setState({
                    file_list : data,
                    pages_num : pages_num,
                    current_list : current_list,
                    disableNextButton : pages_num <= 1,
                });
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
    };

    openUploadDialog = () => {
        this.refs.Dialog.handleOpen();
    };

    showProgress = () => {
        this.setState({
            progress : true
        })
    };

    hiddenProgress = () => {
        this.setState({
            progress : false
        });
        this.getFileList();
    };

    handleChange = (event, index, value) => {
        $.ajax({
            url : API.BlockSize,
            type : 'GET',
            data : {
                size : value,
            },
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                this.setState({blockSize : value});
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
    };

    renameFile = (index) => {
        const file = this.state.current_list[index];
        this.refs.RenameDialog.handleOpen(file.id, file.name);
    };

    downloadFile = (index) => {
        const file = this.state.current_list[index];
        console.log(file.id);
        $.ajax({
            url : API.Download,
            type : 'GET',
            data : {
                id : file.id,
            },
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                if(data !== 'File Not Found')
                    window.open(data);
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
    };

    removeFile = (index) => {
        const file = this.state.current_list[index];
        console.log(file.id);
        this.refs.DeleteDialog.handleOpen(file.id);
    };

    componentDidMount() {
        //this.getFileList();
        //this.getNodeStatus();
        let current_list = sample.slice(0, 10);
        let pages_num = parseInt((sample.length / 10), 10) + ((sample.length % 10 > 0) ? 1 : 0);
        this.setState({
            file_list : sample,
            pages_num : pages_num,
            current_list : current_list,
            disableNextButton : pages_num <= 1,
        });
    }

    previousPage= () => {
        let current_page = parseInt(this.state.current_page, 10) - 1;
        let current_list = this.state.file_list.slice((current_page - 1) * 10, (current_page - 1) * 10 + 10);
        this.setState({
            current_page : current_page,
            current_list : current_list,
            disableNextButton: false,
            disablePreviousButton: ((parseInt(this.state.current_page, 10) - 1) === 1),
        });
    };

    nextPage = () => {
        let current_page = (parseInt(this.state.current_page, 10) + 1);
        let current_list = this.state.file_list.slice((current_page - 1) * 10, (current_page - 1) * 10 + 10);
        this.setState({
            current_page : current_page,
            current_list : current_list,
            disableNextButton: ((parseInt(this.state.current_page, 10) + 1) === parseInt(this.state.pages_num, 10)),
            disablePreviousButton: false,
        });
    };

    render() {
        return (
            <div>
              <div className="title">
                  <h1>NovaStar</h1>
                  <h2>A Tiny Flat Distributed File System</h2>
              </div>
                {this.state.progress ? <LinearProgress mode="indeterminate" color="#2EFF99" /> : null}
                <Card>
                  <div style={styles.card}>
                      <div style={{textAlign : 'center'}}>
                          <Subheader>节点状态</Subheader>
                          {this.state.slaves.map((slave, index)=>(
                              <div key={index} style={styles.slaveStatus}>节点 {index + 1}
                                <FileCloudCircle style={styles.iconStyles} color={slave ? greenA200 : red500} />
                              </div>
                          ))}
                          <br />
                          <SelectField
                              style={{textAlign : 'left', marginTop : 16}}
                              floatingLabelText="文件分块大小"
                              value={this.state.blockSize}
                              onChange={this.handleChange}
                          >
                              <MenuItem value={8} primaryText="8M" />
                              <MenuItem value={16} primaryText="16M" />
                              <MenuItem value={32} primaryText="32M" />
                              <MenuItem value={64} primaryText="64M" />
                              <MenuItem value={128} primaryText="128M" />
                          </SelectField>
                          <br />
                      </div>



                      <Table
                          style={styles.table}
                          bodyStyle={styles.tableBody}
                          selectable={false}>
                          <TableHeader
                              displaySelectAll={false}
                              adjustForCheckbox={false}>
                              <TableRow>
                                  <TableHeaderColumn colSpan="6" tooltip="文件列表" style={{fontSize : '2vh', textAlign : 'center'}}>
                                      文件列表
                                  </TableHeaderColumn>
                              </TableRow>
                              <TableRow>
                                  <TableHeaderColumn colSpan="2" style={{fontSize : '2vh'}}>名称</TableHeaderColumn>
                                  <TableHeaderColumn style={{fontSize : '2vh'}}>大小</TableHeaderColumn>
                                  <TableHeaderColumn  style={{fontSize : '2vh'}}>上传时间</TableHeaderColumn>
                                  <TableHeaderColumn colSpan="2" style={{fontSize : '2vh', textAlign : 'right'}}>操作</TableHeaderColumn>
                              </TableRow>
                          </TableHeader>
                          <TableBody
                              showRowHover={true}
                              displayRowCheckbox={false}>
                              {this.state.current_list.map((file, index) => (
                                  <TableRow key={index}>
                                      <TableRowColumn colSpan="2">{file.name}</TableRowColumn>
                                      <TableRowColumn>{file.size}</TableRowColumn>
                                      <TableRowColumn>{file.uploadTime}</TableRowColumn>
                                      <TableRowColumn colSpan="2" style={styles.tableRightColumn} id={index}>
                                          <FlatButton
                                              label="下载"
                                              primary={true}
                                              icon={<FileFileDownload/>}
                                              onTouchTap={()=>{this.downloadFile(index)}}
                                          />
                                          <FlatButton
                                              label="重命名"
                                              primary={true}
                                              icon={<ActionBuild/>}
                                              onTouchTap={()=>{this.renameFile(index)}}
                                              alt={index}
                                          />
                                          <FlatButton
                                              label="删除"
                                              primary={true}
                                              icon={<ActionDelete/>}
                                              onTouchTap={()=>{this.removeFile(index)}}
                                              alt={index}
                                          />
                                      </TableRowColumn>
                                  </TableRow>
                              ))}
                          </TableBody>
                          <TableFooter
                              adjustForCheckbox={false}>
                          </TableFooter>
                      </Table>

                      <CardActions>
                          <RaisedButton
                              label="上传"
                              style={styles.button}
                              containerElement="label"
                              primary={true}
                              onTouchTap={this.openUploadDialog}
                              icon={<ActionBackup/>}/>
                          <RaisedButton
                              label="刷新"
                              style={styles.button}
                              containerElement="label"
                              primary={true}
                              onTouchTap={this.getFileList}
                              icon={<NotificationSync/>}/>
                          <div style={{float:'right', marginTop:12}}>
                            <FlatButton  primary={true} label="上一页" onTouchTap={this.previousPage} disabled={this.state.disablePreviousButton} />
                            {this.state.current_page}/{this.state.pages_num || 1}
                            <FlatButton style={{textAlign : 'right'}}  primary={true} label="下一页" onTouchTap={this.nextPage} disabled={this.state.disableNextButton} />
                          </div>
                          <div style={{clear:'both'}}/>
                      </CardActions>
                      <div style={{textAlign : 'right', color : 'rgba(0, 0, 0, 0.298039)', margin: '0px 32px 16px 0px'}}>
                          {'已使用空间 ' + this.state.used_space + 'G | 总空间大小 ' +　this.state.capacity + 'G'}
                      </div>
                  </div>
                </Card>
                <UploadFileDialog ref="Dialog" onUpload={this.showProgress} onSuccess={this.hiddenProgress}/>
                <RenameFileDialog ref="RenameDialog" onSuccess={this.hiddenProgress}/>
                <DeleteFileDialog ref="DeleteDialog" onSuccess={this.hiddenProgress}/>
            </div>
        );
    }
}

export default App;
