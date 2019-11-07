import { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { push } from 'connected-react-router';
import { IReduxState } from '../store/reducers';

const selectorAuthLoyout = ({ user: { user }, router: { location: { pathname } } }: IReduxState) => ({
  user,
  pathname,
});

export default function AuthLoyout({ children}: {children: any}) {

  const { user, pathname } = useSelector(selectorAuthLoyout, shallowEqual);


  const dispatch = useDispatch();

  useEffect(() => {
    if (user == null) return;

    if (user.isGaming && user.currentRoomId == null) {
      console.error('用户正在游戏中', '但找不到房间号');
    }

    if (user.isGaming && user.currentRoomId != null) {
      const targetPath = `/game/${user.currentRoomId}`;
      if (pathname !== targetPath) dispatch(push(targetPath));
    } else if (user.currentRoomId != null) {
      const targetPath = `/room/${user.currentRoomId}`;
      if (pathname !== targetPath) dispatch(push(targetPath));
    }
  }, [user, pathname, dispatch]);


  return children;
}
