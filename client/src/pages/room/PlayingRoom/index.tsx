import './index.scss';

import React, { useCallback, useEffect } from 'react';
import { batch as batchDispatch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks';
import { roomActions, userActions } from '@/store/actions';
import { roomEffects } from '@/store/effects';
import { IReduxState } from '@/store/reducers';
import FullScreenLoading from '@/ui/FullScreenLoading';
import wsClient from '@/WebsocketClient/wsClient';
import { Button } from '@material-ui/core';

import { ReservedEventName } from '@/types/constants';
import { RoomStatus } from '@/types/constants/room';
import { IGame, IRoom, IUser } from '@/types/service';

import RoomChatting from './components/RoomChatting';
import RoomHeader from './components/RoomHeader';
import UserList from './components/UserList';

// import { IGame, IRoom, IUser } from '@/types/service';

const selectorPlayingRoom = ({
  room: { currentRoom },
  user: { user },
}: IReduxState) => ({
  currentRoom,
  isReady: user == null ? false : user.isReady,
});

// const roomTypeTextMapping = {
//   [RoomType.PRIVATE]: '(私人)',
//   [RoomType.PUBLIC]: '',
// };

export default function PlayingRoom() {
  useDocumentTitle('房间');
  const { currentRoom, isReady } = useSelector(
    selectorPlayingRoom,
    shallowEqual,
  );

  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = parseInt(rawRoomId, 10);

  const dispatch = useDispatch();
  const toggleGameReady = useCallback(() => {
    dispatch(roomEffects.makeGameIsReady(!isReady));
  }, [isReady, dispatch]);

  useEffect(() => {
    const refreshRoomInfoOff = wsClient.listen(ReservedEventName.REFRESH_ROOM, (_, msg) => {
      const room = msg.data as IRoom;
      dispatch(roomActions.createSetRoom(room));
    });
    const startGameOff = wsClient.listen(ReservedEventName.START_GAME, (_, msg) => {
      const { user, game } = msg.data as {
        user: IUser,
        game: IGame,
      };
      batchDispatch(() => {
        dispatch(roomActions.createSetCurrentGame(game));
        dispatch(roomActions.createSetCurrentRoomStatus(RoomStatus.GAMING));
        dispatch(userActions.createSetIsGaming(user.isGaming));
        dispatch(userActions.createSetIsReady(user.isReady));
      })
    });
    return () => {
      refreshRoomInfoOff();
      startGameOff();
    };
  }, [roomId, dispatch]);

  useEffect(() => {
    if (Number.isNaN(roomId)) return;
    dispatch(roomEffects.enterRoom(roomId));
  }, [dispatch, roomId]);

  if (rawRoomId == null) return <Redirect to="/" />;
  if (currentRoom == null) return <FullScreenLoading />;

  return (
    <div className="view-playing-room">
      <div className="view-playing-room-header">
        <RoomHeader />
      </div>
      <div className="view-playing-room-main">
        <UserList users={currentRoom.users} />
        <div className="start-game-button-wrapper">
          <Button style={{
            // backgroundColor: 'orange',
            // color: '#fff',
            boxShadow: 'none',
          }} onClick={toggleGameReady} color="primary" className="start-game-button" variant="contained" fullWidth>
            {isReady ? '取消准备' : '准备'}
          </Button>
        </div>
        <div className="room-message-wrapper">
          <RoomChatting />
        </div>
      </div>
    </div>
  );
}
