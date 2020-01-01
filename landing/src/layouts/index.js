import React, { Fragment } from 'react';
import _ from 'lodash';

class IndexLayout extends React.PureComponent {
  previousPath = '';

  componentDidUpdate(prevProps) {
    const { location } = this.props;
    const { location: prevLocation } = prevProps;
    if (!_.isEqual(location, prevLocation)) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    const { children } = this.props;
    return <Fragment>{children}</Fragment>;
  }
}

export default IndexLayout;
