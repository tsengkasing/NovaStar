/**
 * Created by tsengkasing on 1/18/2017.
 */
import React from 'react';
import './App.css';
import {hashHistory} from 'react-router';
import {Card, CardActions} from 'material-ui/Card';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import LinearProgress from 'material-ui/LinearProgress';
import ActionLock from 'material-ui/svg-icons/action/lock';
import {cyan500, grey600} from 'material-ui/styles/colors';
import NavigationRefresh from 'material-ui/svg-icons/navigation/refresh';
import FileFileDownload from 'material-ui/svg-icons/file/file-download';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';
import 'jquery-form';
import Auth from './Auth';
import $ from 'jquery';

const styles = {
    card : {
        margin : '0 auto',
        maxWidth : '1076px',
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
        textAlign : 'right',
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
    Refresh : URL + '/refresh',
    Download : URL + '/download',
    Code : URL + '/checkcode',
    SpaceStatus : URL + '/space',
    Login : URL + '/login',
};

class CodeDialog extends React.Component {
    state = {
        open: false,
        fileId : null,
        code : null,
        callback : null,
        error : null,
    };

    handleOpen = (fileId, callback) => {
        this.setState({
            open: true,
            fileId : fileId,
            callback : callback
        });
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleChange = (event) => {
        this.setState({
            code: event.target.value,
            error : null,
        });
    };

    handleSubmit = () => {
        const data = {id : this.state.fileId, code : this.state.code};
        $.ajax({
            url : API.Code,
            type : 'POST',
            data : JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                if(data) {
                    this.state.callback(this.state.fileId);
                    this.setState({open: false});
                }
                else
                    this.setState({error: 'Error Code' });
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
                    title="Input code"
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >

                    <TextField
                        onChange={this.handleChange}
                        value={this.state.filename}
                        floatingLabelText="Code"
                        errorText={this.state.error}
                    /><br />
                </Dialog>
            </div>
        );
    }
}

class LoginDialog extends React.Component {
    state = {
        open: false,
        password : null,
    };

    handleOpen = () => {
        this.setState({
            open: true,
        });
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleChange = (event) => {
        this.setState({
            password: event.target.value,
        });
    };

    handleSubmit = () => {
        const data = { password : this.state.password};
        $.ajax({
            url : API.Login,
            type : 'POST',
            data : JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                this.setState({open: false});
                Auth.Login = true;
                if(data) hashHistory.push('/admin');
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
                    title="Input code"
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >

                    <TextField
                        type="password"
                        onChange={this.handleChange}
                        value={this.state.filename}
                        floatingLabelText="Code"
                    /><br />
                </Dialog>
            </div>
        );
    }
}

class Home extends React.Component {

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

            used_space : 0,
            capacity : 0,
        };
    }

    getSpaceStatus = () => {
        $.ajax({
            url : API.SpaceStatus,
            type : 'GET',
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                //console.log(data);
                this.setState({
                    capacity : data.total,
                    used_space : data.used,
                });
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
    };

    getFileList = () => {
        $.ajax({
            url : API.Refresh,
            type : 'GET',
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);

                const list = data;

                let pages_num = parseInt((list.length / 10), 10) + ((list.length % 10 > 0) ? 1 : 0) || 1;
                let current_page = Math.min(this.state.current_page, pages_num);
                let current_list = list.slice((current_page - 1) * 10, (current_page - 1) * 10 + 10);
                this.setState({
                    current_page : current_page,
                    file_list : list,
                    pages_num : pages_num,
                    current_list : current_list,
                    disableNextButton: ((parseInt(current_page, 10)) === pages_num),
                    disablePreviousButton: ((parseInt(current_page, 10)) === 1),
                });
                this.getSpaceStatus();
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
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
        setTimeout(this.getFileList, 1000);
    };

    checkCode = (index) => {
        const file = this.state.current_list[index];
        if(file.code) {
            this.refs.CodeDialog.handleOpen(file.id, this.downloadFile);
        }else {
            this.downloadFile(file.id);
        }

    };

    downloadFile = (id) => {
        this.showProgress();
        $.ajax({
            url : API.Download,
            type : 'GET',
            data : {
                id : id,
            },
            contentType: 'application/json;charset=UTF-8',
            success : function(data, textStatus, jqXHR) {
                console.log(data);
                this.hiddenProgress(true);
                var time = 500;
                if(data.slice(-3) === 'mp4') time = 5000;
                setTimeout(()=>window.open(data), time);
            }.bind(this),
            error : function(xhr, textStatus) {
                console.log(xhr.status + '\n' + textStatus + '\n');
            }
        });
    };

    componentDidMount() {
        this.getFileList();
        setInterval(this.getFileList, 32000);
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
            <MuiThemeProvider>
            <div>
                {this.state.progress ? <LinearProgress mode="indeterminate" color="#2EFF99" /> : null}
                <Card>
                    <div style={styles.card}>

                        <Table
                            style={styles.table}
                            bodyStyle={styles.tableBody}
                            selectable={false}>
                            <TableHeader
                                displaySelectAll={false}
                                adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn colSpan="5" style={{fontSize : '2vh', textAlign : 'center'}}>
                                        File List
                                    </TableHeaderColumn>
                                </TableRow>
                                <TableRow>
                                    <TableHeaderColumn colSpan="2" style={{fontSize : '2vh'}}>File Name</TableHeaderColumn>
                                    <TableHeaderColumn style={{fontSize : '2vh'}}>File Size</TableHeaderColumn>
                                    <TableHeaderColumn style={{fontSize : '2vh'}}>Modified Time</TableHeaderColumn>
                                    <TableHeaderColumn colSpan="1" style={{fontSize : '2vh', textAlign : 'right'}} onTouchTap={()=>this.refs.LoginDialog.handleOpen()}>Operation</TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody
                                showRowHover={true}
                                displayRowCheckbox={false}>
                                {this.state.current_list.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableRowColumn colSpan="2">{file.name}</TableRowColumn>
                                        <TableRowColumn>{file.size}</TableRowColumn>
                                        <TableRowColumn>{file.modified_time}</TableRowColumn>
                                        <TableRowColumn colSpan="1" style={styles.tableRightColumn} id={index}>
                                            <IconButton
                                                iconStyle={{color : 'rgb(0, 188, 212)'}}
                                                tooltipPosition="center-center"
                                                tooltip="Lock">
                                                <ActionLock color={file.code ? cyan500 : grey600} />
                                            </IconButton>
                                            <IconButton
                                                iconStyle={{color : 'rgb(0, 188, 212)'}}
                                                tooltip="Download"
                                                tooltipPosition="center-center"
                                                onTouchTap={()=>{this.checkCode(index)}}>
                                                <FileFileDownload/>
                                            </IconButton>
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
                                label="Refresh"
                                style={styles.button}
                                containerElement="label"
                                primary={true}
                                onTouchTap={this.getFileList}
                                icon={<NavigationRefresh/>}/>
                            <div style={{float:'right', marginTop:12}}>
                                <FlatButton  primary={true} label="PREVIOUS" onTouchTap={this.previousPage} disabled={this.state.disablePreviousButton} />
                                {this.state.current_page}/{this.state.pages_num || 1}
                                <FlatButton style={{textAlign : 'right', minWidth : 0}}  primary={true} label="NEXT" onTouchTap={this.nextPage} disabled={this.state.disableNextButton} />
                            </div>
                            <div style={{clear:'both'}}/>
                        </CardActions>
                        <div style={{textAlign : 'right', color : 'rgba(0, 0, 0, 0.6)', margin: '0px 32px 16px 0px'}}>
                            {'Used-Space : ' + this.state.used_space + ' | Capacity : ' +　this.state.capacity}
                        </div>
                    </div>
                </Card>
                <CodeDialog ref="CodeDialog" />
                <LoginDialog ref="LoginDialog" />
            </div>
            </MuiThemeProvider>
        );
    }
}

export default Home;