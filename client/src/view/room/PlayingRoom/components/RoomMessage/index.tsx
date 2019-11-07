import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  List,
  ListItem,
  Button,
} from '@material-ui/core';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';

import { IChattingMessage } from '@/model/types';
import { IReduxState } from '@/store/reducers';
import { roomEffects } from '@/store/effects';
import { createHandleOnKeyEnterUp } from '@/util/helper';

import './index.scss';

const selectorRoomMessage = ({
  connection: { wsClient },
  user: { user },
}: IReduxState) => ({
  wsClient,
  username: user == null ? '' : user.username,
  userId: user == null ? '' : user.id,
});

function RoomMessage() {
  const { wsClient, userId } = useSelector(
    selectorRoomMessage,
    shallowEqual,
  );
  const [chatMsgList, setChatMsgList] = useState<IChattingMessage[]>([]);
  useEffect(() => {
    const offReciveChatMessage = wsClient.on('reciveChatMessage', (_, msg) => {
      const chatMsg = msg.data as IChattingMessage;
      setChatMsgList(prev => [chatMsg].concat(...prev));
    });
    return offReciveChatMessage;
  }, [wsClient, setChatMsgList]);

  // chat msg 相关

  const [msgContent, setMsgContent] = useState('');
  const isValidatedContentt = msgContent.trim().length !== 0;
  const dispatch = useDispatch();
  const sendChatMessage = useCallback(() => {
    if (!isValidatedContentt) return;
    setMsgContent('');
    dispatch(roomEffects.sendChatMessage(msgContent));
  }, [isValidatedContentt, msgContent, dispatch, setMsgContent]);

  return (
    <div className="room-message">
      <List className="room-message-list">
        {chatMsgList.map(cm => (
          <ListItem className="room-message-list-item" key={cm.id}>
            <div className="room-message-speaker">
              <span className="room-message-speaker-name">
                {cm.speaker.id === userId ? '我' : cm.speaker.name}说:
              </span>

            </div>
            <div className="room-message-content">{cm.content}</div>
            <div className="room-message-speaker-time">
              {new Date(cm.timestamp).toLocaleTimeString()}
            </div>
          </ListItem>
        ))}
      </List>
      <List className="room-message-sender">
        <ListItem>
          <TextField
            variant="outlined"
            value={msgContent}
            onChange={evt => setMsgContent(evt.target.value)}
            onKeyUp={createHandleOnKeyEnterUp(sendChatMessage)}
            fullWidth
          />
          &nbsp;
          <Button
            onClick={sendChatMessage}
            disabled={!isValidatedContentt}
            variant="text"
          >
            发送
          </Button>
        </ListItem>
      </List>
    </div>
  );
}

export default RoomMessage;
