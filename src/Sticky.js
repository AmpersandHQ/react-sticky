import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';

export default class Sticky extends Component {
    static propTypes = {
        topOffset: PropTypes.number,
        bottomOffset: PropTypes.number,
        relative: PropTypes.bool,
        setAsSticky: PropTypes.bool,
        children: PropTypes.func,
    };

    static defaultProps = {
        relative: false,
        topOffset: 0,
        bottomOffset: 0,
        setAsSticky: true,
        disableCompensation: false,
        disableHardwareAcceleration: false,
        children: () => {},
    };

    static contextTypes = {
        subscribe: PropTypes.func,
        unsubscribe: PropTypes.func,
        getParent: PropTypes.func,
    };

    state = {
        isSticky: false,
        wasSticky: false,
        style: {},
    };

    refContent = createRef();
    refPlaceholder = createRef();

    componentDidMount() {
        if (!this.context.subscribe)
            throw new TypeError(
                'Expected Sticky to be mounted within StickyContainer'
            );

        this.context.subscribe(this.handleContainerEvent);
    }

    componentWillUnmount() {
        this.context.unsubscribe(this.handleContainerEvent);
    }

    componentDidUpdate() {
        this.refPlaceholder.current.style.paddingBottom = this.props.disableCompensation
            ? 0
            : `${this.state.isSticky ? this.state.calculatedHeight : 0}px`;
    }

    handleContainerEvent = ({
        distanceFromTop,
        distanceFromBottom,
        eventSource,
    }) => {
        const parent = this.context.getParent();
        const {
            relative,
            setAsSticky,
            disableHardwareAcceleration,
            topOffset,
            bottomOffset,
            topPos,
        } = this.props;
        const { isSticky } = this.state;

        if (!setAsSticky) {
            return null;
        }

        let preventingStickyStateChanges = false;
        if (relative) {
            preventingStickyStateChanges = eventSource !== parent;
            distanceFromTop =
                -(eventSource.scrollTop + eventSource.offsetTop) +
                this.refPlaceholder.current.offsetTop;
        }

        const placeholderClientRect = this.refPlaceholder.current.getBoundingClientRect();
        const contentClientRect = this.refContent.current.getBoundingClientRect();
        const calculatedHeight = contentClientRect.height;

        const bottomDifference =
            distanceFromBottom - bottomOffset - calculatedHeight;

        const wasSticky = !!isSticky;
        const sticky = setAsSticky && preventingStickyStateChanges
            ? wasSticky
            : distanceFromTop <= -topOffset &&
              distanceFromBottom > -bottomOffset;

        distanceFromBottom =
            (relative
                ? parent.scrollHeight - parent.scrollTop
                : distanceFromBottom) - calculatedHeight;

        const top = bottomDifference > 0
            ? relative
                ? parent.offsetTop - parent.offsetParent.scrollTop
                : topPos || 0
            : bottomDifference;

        const style = !sticky
            ? {}
            : {
                  position: 'fixed',
                  top,
                  left: placeholderClientRect.left,
                  width: placeholderClientRect.width,
              };

        if (!disableHardwareAcceleration) {
            style.transform = 'translateZ(0)';
        }

        return this.setState({
            isSticky: sticky,
            wasSticky,
            distanceFromTop,
            distanceFromBottom,
            calculatedHeight,
            style,
        });
    };

    render() {
        const element = React.cloneElement(
            this.props.children({
                isSticky: this.state.isSticky,
                wasSticky: this.state.wasSticky,
                style: this.state.style,
            }),
            {
                ref: content => this.refContent.current = content,
            }
        );

        return (
            <div className="js-react-sticky">
                <div ref={placeholder => (this.refPlaceholder.current = placeholder)} />
                {element}
            </div>
        );
    }
}
