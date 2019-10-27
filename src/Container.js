import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';
import raf from 'raf';
import events from '../constants/eventTypes';

export default class Container extends PureComponent {
    parent = createRef();

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

    rafHandle = null;

    subscribe = handler => {
        this.subscribers = this.subscribers.concat(handler);
    };

    unsubscribe = handler => {
        this.subscribers = this.subscribers.filter(
            current => current !== handler
        );
    };

    notifySubscribers = evt => {
        if (!this.framePending) {
            const { currentTarget } = evt;

            this.rafHandle = raf(() => {
                this.framePending = false;
                const { top, bottom } = this.parent.current.getBoundingClientRect();

                this.subscribers.forEach(handler =>
                    handler({
                        distanceFromTop: top,
                        distanceFromBottom: bottom,
                        eventSource:
                            currentTarget === window
                                ? document.body
                                : this.parent.current,
                    })
                );
            });
            this.framePending = true;
        }
    };

    getParent = () => this.parent.current;

    componentDidMount() {
        if (this.props.enableSticky) {
            events.forEach(event =>
                window.addEventListener(event, this.notifySubscribers)
            );
        }
    }

    componentWillUnmount() {
        if (this.rafHandle) {
            raf.cancel(this.rafHandle);
            this.rafHandle = null;
        }

        events.forEach(event =>
            window.removeEventListener(event, this.notifySubscribers)
        );
    }

    render() {
        return (
            <div
                {...this.props}
                ref={node => (this.parent.current = node)}
                onScroll={this.notifySubscribers}
                onTouchStart={this.notifySubscribers}
                onTouchMove={this.notifySubscribers}
                onTouchEnd={this.notifySubscribers}
            />
        );
    }
}
