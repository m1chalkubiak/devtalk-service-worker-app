import { takeLatest, all, take, put, select } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import reportError from 'report-error';

import { StartupTypes } from '../startup';
import { selectLoggedUser } from '../users';
import { UserAuthActions } from '../userAuth';
import { SyncTypes } from './sync.redux';


const listenForOnlineSyncChannel = () => eventChannel((emitter) => {
  const emitStatus = () => emitter(navigator.onLine);

  window.addEventListener('online', emitStatus);
  window.addEventListener('offline', emitStatus);

  return () => {
    window.removeEventListener('online', emitStatus);
    window.removeEventListener('navigator.onLine', emitStatus);
  };
});

const listenForSyncStatusChannel = () => eventChannel((emitter) => {
  const emitStatus = (message) => {
    if (message.data.type === 'syncStatus') {
      emitter(message.data.value);
    }
  };

  navigator.serviceWorker.addEventListener('message', emitStatus);

  return () => {
    navigator.serviceWorker.removeEventListener('online', emitStatus);
  };
});

function* listenForOnlineSync() {
  try {
    const listenForOnlineSyncChan = yield listenForOnlineSyncChannel();

    while (true) { // eslint-disable-line
      const isOnline = yield take(listenForOnlineSyncChan);

      yield put(UserAuthActions.setOnlineStatus(isOnline));
    }
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* listenForSyncStatus() {
  try {
    const listenForSyncStatusChan = yield listenForSyncStatusChannel();

    while (true) { // eslint-disable-line
      const isSyncing = yield take(listenForSyncStatusChan);

      yield put(UserAuthActions.setSyncStatus(isSyncing));
    }
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* registerSync() {
  try {
    navigator.serviceWorker.register('sw.index.js');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* syncWaterConsumption({ value }) {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'drinkWater', uid, value });
    swRegistration.sync.register('drinkWaterSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* syncResetWaterConsumption() {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'resetWaterConsumption', uid, value: 0 });
    swRegistration.sync.register('resetWaterConsumptionSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* syncUserData({ user }) {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'updateUserData', uid, user });
    swRegistration.sync.register('updateUserDataSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* syncAddAlarm({ data }) {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'addAlarm', uid, timeData: data });
    swRegistration.sync.register('addAlarmSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* syncRemoveAlarm({ id }) {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'removeAlarm', uid, id });
    swRegistration.sync.register('removeAlarmSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

function* initializeAlarms() {
  try {
    const loggedUser = yield select(selectLoggedUser);
    const uid = loggedUser.get('uid', '');
    const swRegistration = yield navigator.serviceWorker.ready;

    navigator.serviceWorker.controller.postMessage({ type: 'initializeAlarms', uid });
    swRegistration.sync.register('initializeAlarmsSync');
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}

export default function* watchSync() {
  try {
    yield all([
      takeLatest(StartupTypes.STARTUP, listenForOnlineSync),
      takeLatest(StartupTypes.STARTUP, listenForSyncStatus),
      takeLatest(StartupTypes.STARTUP, registerSync),
      takeLatest(SyncTypes.SYNC_WATER_CONSUMPTION, syncWaterConsumption),
      takeLatest(SyncTypes.SYNC_RESET_WATER_CONSUMPTION, syncResetWaterConsumption),
      takeLatest(SyncTypes.SYNC_USER_DATA, syncUserData),
      takeLatest(SyncTypes.SYNC_ADD_ALARM, syncAddAlarm),
      takeLatest(SyncTypes.SYNC_REMOVE_ALARM, syncRemoveAlarm),
      takeLatest(SyncTypes.INITIALIZE_ALARMS, initializeAlarms),
    ]);
  } catch (error) {
    /* istanbul ignore next */
    reportError(error);
  }
}
