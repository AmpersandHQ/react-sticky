import React, { Component, Children, createRef } from 'react';
import PropTypes from 'prop-types';

class Sticky extends Component {
    constructor(props) {
        super(props);

        this.contentRef = createRef();
        this.placeholderRef = createRef();
    }

    state = {
        isSticky: false,
        wasSticky: false,
        childClass: 'js-react-not-sticky',
        style: {},
    };

    componentDidMount() {
        if (!this.context.subscribe) {
            throw new TypeError(
                'Expected Sticky to be mounted within StickyContainer'
            );
        }

        this.context.subscribe(this.handleContainerEvent);
    }

    componentWillUnmount() {
        this.context.unsubscribe(this.handleContainerEvent);
    }

    componentDidUpdate() {
        const { isSticky, calculatedHeight } = this.state;
        let height = 'auto';

        if (isSticky) {
            height = `${calculatedHeight}px`;
        }

        this.placeholderRef.current.style.height = height;
    }

    handleContainerEvent = ({
        distanceFromTop,
        distanceFromBottom,
        eventSource,
    }) => {
        const { setAsSticky, relative, topOffset, bottomOffset } = this.props;
        const { isSticky } = this.state;
        let childClass = 'js-react-not-sticky';

        if (!setAsSticky) {
            return false;
        }

        const parent = this.context.getParent();

        let preventingStickyStateChanges = false;
        if (relative) {
            preventingStickyStateChanges = eventSource !== parent;
            distanceFromTop =
                -(eventSource.scrollTop + eventSource.offsetTop) +
                this.placeholderRef.current.offsetTop;
        }

        // const placeholderClientRect = this.placeholderRef.current.getBoundingClientRect();
        const calculatedHeight = this.contentRef.current.getBoundingClientRect().height;

        const bottomDifference =
            distanceFromBottom - bottomOffset - calculatedHeight;

        const wasSticky = !!isSticky && setAsSticky;
        const sticky = setAsSticky && preventingStickyStateChanges
            ? wasSticky
            : distanceFromTop <= -topOffset &&
              distanceFromBottom > -bottomOffset;

        distanceFromBottom =
            (relative
                ? parent.scrollHeight - parent.scrollTop
                : distanceFromBottom) - calculatedHeight;

        if (isSticky) {
            childClass = 'js-react-is-sticky';
        }

        const style = isSticky ? {
            top: bottomDifference > 0
                ? this.props.relative
                    ? parent.offsetTop - parent.offsetParent.scrollTop
                    : 0
                : bottomDifference,
        } : {};

        this.setState({
            isSticky: sticky,
            wasSticky,
            distanceFromTop,
            distanceFromBottom,
            calculatedHeight,
            childClass,
            style,
        });
    };

    render() {
        const { children, className } = this.props;
        const { childClass, style } = this.state;

        const element = Children.only(React.cloneElement(children, {
                ...children.props,
                className: `${children.props.className || ''} ${childClass}`,
                style,
                ref: this.contentRef,
            })
        );

        return (
            <div
                className={className}
                ref={this.placeholderRef}>
                {element}
            </div>
        );
    }
}

Sticky.propTypes = {
    topOffset: PropTypes.number,
    bottomOffset: PropTypes.number,
    relative: PropTypes.bool,
    children: PropTypes.node,
};

Sticky.defaultProps = {
    relative: false,
    topOffset: 0,
    bottomOffset: 0,
    children: null,
};

Sticky.contextTypes = {
    subscribe: PropTypes.func,
    unsubscribe: PropTypes.func,
    getParent: PropTypes.func,
};

export default Sticky;
