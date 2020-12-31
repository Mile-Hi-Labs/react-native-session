import React, { Component } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from 'utils/helpers';

const SessionContext = React.createContext();

class SessionProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      token: null,
      modelName: this.props.modelName || 'user',
      loadUser: this.loadUser.bind(this),
      authenticated: this.authenticated.bind(this),
      authenticate: this.authenticate.bind(this),
      logout: this.logout.bind(this),
      loaded: false,
    };
  }


  // Hooks
  componentDidMount() {
    logger('React Native Session initiated...');
    this.init();
  }


  // Methods
  async init() {
    let userId = await AsyncStorage.getItem('userId');
    let token = await AsyncStorage.getItem('token');
    userId && token ? this.loadUser(this.state.model, userId, token, this.props.params) : this.setState({ loaded: true });
  }

  async loadUser(modelName, modelId, token, params = {}) {
    try {
      if (!this.props.store) {  return };
      this.props.store.adapterFor('app').token = token;
      let user = await this.props.store.queryRecord(modelName, modelId, params);
      logger('Session authenticated: ', this.state);
      await this.setState({ token: token, user: user });
    } catch(e) {
      await this.logout();
    } finally {
      this.setState({ loaded: true });
    }
  }

  async authenticate(model, data) {
    await AsyncStorage.setItem('userId', data.id);
    await AsyncStorage.setItem('token', data.token);
    return await this.loadUser(model, data.id, data.token, {});
  }

  async logout() {
    await AsyncStorage.multiRemove(['userId', 'token']);
    await this.setState({ token: '', user: {} });
    logger('Session terminated: ', this.state);
  }

  authenticated() {
    return this.state.user.id ? true : false;
  }


  // Render
  render() {
    const { loaded } = this.state;
    const { store, children } = this.props;

    return (
      <SessionContext.Provider value={this.state}>
        {children}
      </SessionContext.Provider>
    )
  }
};

const withSession = function(WrappedFunction) {
  return class extends Component {
    render() {
      return (
        <SessionContext.Consumer>
          {context => <WrappedFunction session={context} {...this.props} />}
        </SessionContext.Consumer>
      );
    }
  }
};

export { SessionProvider, withSession };
