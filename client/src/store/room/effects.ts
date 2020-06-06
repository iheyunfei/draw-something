import Notification from '@/model/Notification';
import wsClient from '@/WebsocketClient/wsClient';
import { push, replace } from 'connected-react-router';
import { batch as batchDispatch } from 'react-redux';
import { RoomStatus, RoomType } from '@/types/constants/room';
import { IGame, IRoom, IUser } from '@/types/service';

import { globalActions, roomActions, userActions } from '../actions';
import { TReduxThunk } from '../effects';

export function getRoomList(): TReduxThunk {
  return async dispatch => {
    try {
      const respMsg = await wsClient.request('roomList');
      const result = respMsg.data as any[];
      dispatch(roomActions.createSetRoomList(result));
    } catch (err) {
      console.error(err);
    }
  };
}

let isEnteringRoom = false;
export function enterRoom(roomId: number): TReduxThunk {
  return async dispatch => {
    if (isEnteringRoom) return;
    isEnteringRoom = true;

    try {
      const respMsg = await wsClient.request('userEnter', {
        roomId,
      });

      const { room, user } = respMsg.data as {
        room: IRoom;
        user: IUser;
      };
      batchDispatch(() => {
        dispatch(roomActions.createSetRoom(room));
        dispatch(userActions.createSetUserCurrentRoomId(user.currentRoomId));
        dispatch(push(`/room/${room.id}`));
      });
    } catch (err) {
      batchDispatch(() => {
        dispatch(push('/'));
        dispatch(globalActions.createAddNotification(new Notification(err.title, 'error')))
      });

    } finally {
      isEnteringRoom = false;
    }
  };
}

export function leaveRoom(): TReduxThunk {
  return async (dispatch, getState) => {
    const {
      user: { user },
    } = getState();
    if (user == null || user.currentRoomId == null) return;
    try {
      wsClient.request('userLeave');
      dispatch(userActions.createSetUserCurrentRoomId(undefined));
      dispatch(roomActions.createSetRoom(null));
      dispatch(push('/'));
    } catch (err) {
      console.error(err);
    }
  };
}

export function createRoom(name: string, type: RoomType): TReduxThunk {
  return async dispatch => {
    try {
      const respMsg = await wsClient.request('createRoom', {
        name,
        type,
      });
      const room = respMsg.data as IRoom;
      dispatch(enterRoom(room.id));
      // dispatch(getRoomList());
    } catch (err) {
      console.error(err);
    }
  };
}

export function sendChatMessage(content: string): TReduxThunk {
  return async dispatch => {
    try {
      wsClient.request('sendChatMessage', { content });
    } catch (err) {
      console.error(err);
    }
  };
}

export function makeGameIsReady(ready: boolean): TReduxThunk {
  const requestType = ready ? 'makeGameReady' : 'cancelGameReady';
  return async dispatch => {
    try {
      const respMsg = await wsClient.request(requestType);
      const { user, room } = respMsg.data as {
        user: IUser;
        room: IRoom;
      };
      dispatch(roomActions.createSetCurrentRoomUsers(room.users));
      dispatch(userActions.createSetIsReady(user.isReady));
    } catch (err) {
      console.error(err);
    }
  };
}

export function getGame(): TReduxThunk {
  return async (dispatch, getState) => {
    const {
      user: { user },
    } = getState();
    try {
      const respMsg = await wsClient.request('getGame');
      const { game } = respMsg.data as {
        user: IUser;
        game: IGame;
      };
      dispatch(roomActions.createSetCurrentGame(game));
      dispatch(roomActions.createSetCurrentRoomStatus(RoomStatus.GAMING));
    } catch (err) {
      dispatch(
        globalActions.createAddNotification(
          new Notification(err.title, 'error'),
        ),
      );
      if (user != null && user.currentRoomId != null) {
        dispatch(replace(`/room/${user.currentRoomId}`));
      } else {
        dispatch(replace('/'));
      }
    }
  };
}
