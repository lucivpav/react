import * as customPropTypes from '@stardust-ui/react-proptypes'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import * as _ from 'lodash'

import {
  UIComponent,
  childrenExist,
  createShorthandFactory,
  isFromKeyboard,
  UIComponentProps,
  ContentComponentProps,
  ChildrenComponentProps,
  commonPropTypes,
  rtlTextContainer,
  applyAccessibilityKeyHandlers,
} from '../../lib'
import Icon from '../Icon/Icon'
import Box from '../Box/Box'
import { buttonBehavior } from '../../lib/accessibility'
import { Accessibility } from '../../lib/accessibility/types'
import { ComponentEventHandler, WithAsProp, ShorthandValue, withSafeTypeForAs } from '../../types'
import ButtonGroup from './ButtonGroup'

export interface ButtonProps
  extends UIComponentProps,
    ContentComponentProps<ShorthandValue>,
    ChildrenComponentProps {
  /**
   * Accessibility behavior if overridden by the user.
   * @default buttonBehavior
   */
  accessibility?: Accessibility

  /** A button can appear circular. */
  circular?: boolean

  /** A button can show it is currently unable to be interacted with. */
  disabled?: boolean

  /** A button can take the width of its container. */
  fluid?: boolean

  /** Button can have an icon.
   * @slot
   */
  icon?: ShorthandValue

  /** A button may indicate that it has only icon. */
  iconOnly?: boolean

  /** An icon button can format an Icon to appear before or after the button */
  iconPosition?: 'before' | 'after'

  /**
   * Called after user's click.
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onClick?: ComponentEventHandler<ButtonProps>

  /**
   * Called after user's focus.
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onFocus?: ComponentEventHandler<ButtonProps>

  /** A button can be formatted to show different levels of emphasis. */
  primary?: boolean

  /** A button can be formatted to show only text in order to indicate some less-pronounced actions. */
  text?: boolean

  /** A button can be formatted to show different levels of emphasis. */
  secondary?: boolean
}

export interface ButtonState {
  isFromKeyboard: boolean
}

class Button extends UIComponent<WithAsProp<ButtonProps>, ButtonState> {
  static create: Function

  static displayName = 'Button'

  static className = 'ui-button'

  static propTypes = {
    ...commonPropTypes.createCommon({
      content: 'shorthand',
    }),
    circular: PropTypes.bool,
    disabled: PropTypes.bool,
    fluid: PropTypes.bool,
    icon: customPropTypes.itemShorthand,
    iconOnly: PropTypes.bool,
    iconPosition: PropTypes.oneOf(['before', 'after']),
    onClick: PropTypes.func,
    onFocus: PropTypes.func,
    primary: customPropTypes.every([customPropTypes.disallow(['secondary']), PropTypes.bool]),
    text: PropTypes.bool,
    secondary: customPropTypes.every([customPropTypes.disallow(['primary']), PropTypes.bool]),
  }

  static defaultProps = {
    as: 'button',
    accessibility: buttonBehavior as Accessibility,
  }

  static Group = ButtonGroup

  state = {
    isFromKeyboard: false,
  }

  actionHandlers = {
    performClick: event => {
      event.preventDefault()
      this.handleClick(event)
    },
  }

  renderComponent({
    ElementType,
    classes,
    accessibility,
    variables,
    styles,
    unhandledProps,
  }): React.ReactNode {
    const { children, content, disabled, iconPosition } = this.props
    const hasChildren = childrenExist(children)

    return (
      <ElementType
        className={classes.root}
        disabled={disabled}
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        {...accessibility.attributes.root}
        {...applyAccessibilityKeyHandlers(accessibility.keyHandlers.root, unhandledProps)}
        {...rtlTextContainer.getAttributes({ forElements: [children] })}
        {...unhandledProps}
      >
        {hasChildren && children}
        {!hasChildren && iconPosition !== 'after' && this.renderIcon(variables, styles)}
        {Box.create(!hasChildren && content, {
          defaultProps: { as: 'span', styles: styles.content },
        })}
        {!hasChildren && iconPosition === 'after' && this.renderIcon(variables, styles)}
      </ElementType>
    )
  }

  renderIcon = (variables, styles) => {
    const { icon, iconPosition, content } = this.props

    return Icon.create(icon, {
      defaultProps: {
        styles: styles.icon,
        xSpacing: !content ? 'none' : iconPosition === 'after' ? 'before' : 'after',
        variables: variables.icon,
      },
    })
  }

  handleClick = (e: React.SyntheticEvent) => {
    const { disabled } = this.props

    if (disabled) {
      e.preventDefault()
      return
    }

    _.invoke(this.props, 'onClick', e, this.props)
  }

  handleFocus = (e: React.SyntheticEvent) => {
    this.setState({ isFromKeyboard: isFromKeyboard() })

    _.invoke(this.props, 'onFocus', e, this.props)
  }
}

Button.create = createShorthandFactory({ Component: Button, mappedProp: 'content' })

/**
 * A button indicates a possible user action.
 */
export default withSafeTypeForAs<typeof Button, ButtonProps, 'button'>(Button)
