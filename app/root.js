import React from 'react'
import Header from './components/header'
import Player from './page/player'
import MusicList from './page/musicList'
import { MUSIC_LIST } from './config/music_list'
import { Router, IndexRoute, Route, Link, hashHistory } from 'react-router'
import { randomRange } from './util/util'

let App = React.createClass({
    getInitialState() {
        return {
            musicList: MUSIC_LIST,
            currentMusicItem: MUSIC_LIST[0],
            repeatType: 'cycle'
        }
    },
    playMusic(musicItem) {
        $('#player').jPlayer('setMedia', {
            mp3: musicItem.file
        }).jPlayer('play');
        this.setState({
            currentMusicItem: musicItem
        })
    },
    playWhenEnd() {
        if (this.state.repeatType === 'random') {
            let index = this.findMusicIndex(this.state.currentMusicItem);
            let randomIndex = randomRange(0, this.state.musicList.length - 1);
            while (randomIndex === index) {
                randomIndex = randomRange(0, this.state.musicList.length - 1)
            }
            this.playMusic(this.state.musicList[randomIndex])
        } else if (this.state.repeatType === 'once') {
            this.playMusic(this.state.currentMusicItem)
        } else {
            this.playNext()
        }
    },
    playNext(type = 'next') {
        let index = this.findMusicIndex(this.state.currentMusicItem);
        //console.log(index)
        let newIndex = null;
        let musicListLength = this.state.musicList.length;
        if (type === 'next') {
            newIndex = (index + 1) % musicListLength
        } else {
            newIndex = (index - 1 + musicListLength) % musicListLength
        }
        this.playMusic(this.state.musicList[newIndex]);
        //console.log(newIndex)
    },
    findMusicIndex(musicItem) {
        return this.state.musicList.indexOf(musicItem)
    },
    componentDidMount() {
        $('#player').jPlayer({
            supplied: 'mp3',
            wmode: 'window'
        });
        this.playMusic(this.state.currentMusicItem);
        $('#player').bind($.jPlayer.event.ended, (e) => {
            this.playWhenEnd()
        });
        PubSub.subscribe('PLAY_MUSIC', (msg, musicItem) => {
            this.playMusic(musicItem)
        });
        PubSub.subscribe('DELETE_MUSIC', (msg, musicItem) => {
            this.setState({
                musicList: this.state.musicList.filter(item => {
                    return item !== musicItem;
                })
            });
            if (this.state.currentMusicItem === musicItem) {
                this.playNext('next')
            }
        });
        PubSub.subscribe('PLAY_PREV', (msg, musicItem) => {
            this.playNext('prev')
        });
        PubSub.subscribe('PLAY_NEXT', (msg, musicItem) => {
            this.playNext()
        });
        let repeatList = [
            'cycle',
            'once',
            'random'
        ];
        PubSub.subscribe('CHANGE_REPEAT', () => {
            let index = repeatList.indexOf(this.state.repeatType);
            index = (index + 1) % repeatList.length;
            this.setState({
                repeatType: repeatList[index]
            })
        })
    },
    componentWillUnmount() {
        PubSub.unsubscribe('PLAY_MUSIC');
        PubSub.unsubscribe('DELETE_MUSIC');
        PubSub.unsubscribe('PLAY_PREV');
        PubSub.unsubscribe('PLAY_NEXT');
        PubSub.unsubscribe('CHANGE_REPEAT');
        //$('#player').unbind($.jPlayer.event.ended)
    },
    render() {
        return (
            <div>
                <Header />
                {React.cloneElement(this.props.children, this.state)};
                {/*{ this.props.children }
                <MusicList currentMusicItem={this.state.currentMusicItem}
                           musicList={this.state.musicList}>
                </MusicList>*/}
            </div>
        )
    }
});
let Root = React.createClass({
    render() {
        return (
            <Router history={hashHistory}>
                <Route path="/" component={App}>
                    <IndexRoute component={Player}></IndexRoute>
                    <Route path="/list" component={MusicList}></Route>
                </Route>
            </Router>
        )
    }
});

export default Root;