import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';
import eventTypes from './constants/eventTypes';

class StickyContainer extends PureComponent {
    constructor(props) {
        super(props);

        this.node = createRef();
    }

    static childContextTypes = {
        subscribe: PropTypes.func,
        unsubscribe: PropTypes.func,
        getParent: PropTypes.func,
    };

    getChildContext() {
        return {
            subscribe: this.subscribe,
            unsubscribe: this.unsubscribe,
            getParent: this.getParent,
        };
    }

    subscribers = [];

    subscribe = handler => {
        this.subscribers = [
            ...this.subscribers,
            handler
        ];
    };

    unsubscribe = handler => {
        this.subscribers = this.subscribers.filter(
            current => current !== handler
        );
    };

    notifySubscribers = evt => {
        if (!this.framePending) {
            const { currentTarget } = evt;
            const parent = this.getParent();

            requestAnimationFrame(() => {
                this.framePending = false;
                const { top, bottom } = parent.getBoundingClientRect();

                this.subscribers.forEach(handler =>
                    handler({
                        distanceFromTop: top,
                        distanceFromBottom: bottom,
                        eventSource:
                            currentTarget === window
                                ? document.body
                                : parent,
                    })
                );
            });
            this.framePending = true;
        }
    };

    getParent = () => this.node.current;

    componentDidMount() {
        if (!window) {
            return null;
        }

        eventTypes.forEach(event =>
            window.addEventListener(event, this.notifySubscribers)
        );
    }

    componentWillUnmount() {
        if (!window) {
            return null;
        }

        eventTypes.forEach(event =>
            window.removeEventListener(event, this.notifySubscribers)
        );
    }

    render() {
        return (
            <div
                {...this.props}
                ref={this.node}
                onScroll={this.notifySubscribers}
                onTouchStart={this.notifySubscribers}
                onTouchMove={this.notifySubscribers}
                onTouchEnd={this.notifySubscribers}
            />
        );
    }
}

export default StickyContainer;
