import {
  Attachment,
  Popup,
  Button,
  Menu,
  AvatarProps,
  ChatMessageProps,
  DividerProps,
  StatusProps,
} from '@stardust-ui/react'
import * as React from 'react'
import * as _ from 'lodash'
import * as keyboardKey from 'keyboard-key'
import { Extendable, ShorthandValue } from 'src/types'
import { ChatData, UserStatus, MessageData, UserData, areSameDay, getFriendlyDateString } from '.'

export enum ChatItemTypes {
  message,
  divider,
}

interface ChatItemType {
  itemType: ChatItemTypes
}

interface ChatMessage extends ChatMessageProps, ChatItemType {
  tabIndex: number
  'aria-labelledby': string
  text: string
}
interface Divider extends DividerProps, ChatItemType {}

type ChatItem = {
  message?: ChatMessage | Divider
  gutter?: AvatarProps
  mine?: boolean
}
type StatusPropsExtendable = Extendable<StatusProps>

const statusMap: Map<UserStatus, StatusPropsExtendable> = new Map([
  ['Available', { color: 'green', icon: 'check', title: 'Available' }],
  ['DoNotDisturb', { color: 'red', icon: 'minus', title: 'Do not disturb' }],
  ['Away', { color: 'yellow', icon: 'clock', title: 'Away' }],
  ['Offline', { color: 'grey', title: 'Offline' }],
] as [UserStatus, StatusPropsExtendable][])

function generateChatMsgProps(message: MessageData, fromUser: UserData): ChatItem {
  const { content, mine } = message
  const messageProps: ChatMessage = {
    // aria-labelledby will need to by generated based on the needs. Currently just hardcoded.
    'aria-labelledby': `sender-${message.id} timestamp-${message.id} content-${message.id}`,
    content: createMessageContent(message),
    mine,
    tabIndex: 0,
    timestamp: {
      content: message.timestamp,
      title: message.timestampLong,
      id: `timestamp-${message.id}`,
      // put aria-label as it was not narrating title, where we have already this information.
      // without aria-label it narrates content of the element, which has date in wrong format.
      'aria-label': `${message.timestampLong}`,
    },
    author: fromUser && {
      content: `${fromUser.firstName} ${fromUser.lastName} `,
      id: `sender-${message.id}`,
    },
    itemType: ChatItemTypes.message,
    text: content,
  }

  return {
    mine,
    message: messageProps,
    gutter: !message.mine && { image: fromUser.avatar, status: statusMap.get(fromUser.status) },
  }
}

function createMessageContent(message: MessageData): ShorthandValue {
  const messageId = `content-${message.id}`
  return {
    id: message.withAttachment ? undefined : messageId,
    content: message.withAttachment
      ? createMessageContentWithAttachments(message.content, messageId)
      : message.content,
  }
}

function createMessageContentWithAttachments(content: string, messageId: string): JSX.Element {
  const menuClickHandler = message => e => {
    alert(`${message} clicked`)
    e.stopPropagation()
  }

  const contextMenu = (
    <Menu
      items={[
        {
          key: 'download',
          content: 'Download',
          icon: 'download',
          onClick: menuClickHandler('Download'),
        },
        {
          key: 'linkify',
          content: 'Get link',
          icon: 'linkify',
          onClick: menuClickHandler('Get link'),
        },
        {
          key: 'tab',
          content: 'Make this a tab',
          icon: 'folder open',
          onClick: menuClickHandler('Make tab'),
        },
      ]}
      vertical
      pills
    />
  )

  const stopPropagationOnKeys = (keys: number[]) => (e: React.KeyboardEvent<any>) => {
    if (keys.indexOf(keyboardKey.getCode(e)) > -1) {
      e.stopPropagation()
    }
  }

  const actionPopup = (
    <Popup
      trapFocus
      trigger={
        <Button
          aria-label="More attachment options"
          iconOnly
          circular
          icon="ellipsis horizontal"
          onClick={e => e.stopPropagation()}
          onKeyDown={stopPropagationOnKeys([keyboardKey.Enter, keyboardKey.Spacebar])}
        />
      }
      content={{ content: contextMenu }}
    />
  )

  return (
    <>
      <span id={messageId}>
        {content} <a href="/"> Some link </a>
      </span>
      <div style={{ marginTop: '20px', display: 'flex' }}>
        {_.map(['MeetingNotes.pptx', 'Document.docx'], (fileName, index) => (
          <Attachment
            key={`attachment-${index}`}
            icon="file word outline"
            aria-label={`File attachment ${fileName}. Press tab for more options Press Enter to open the file`}
            header={fileName}
            action={actionPopup}
            data-is-focusable={true}
            styles={{
              ...(index === 1 ? { marginLeft: '15px' } : {}),
            }}
            onClick={() => alert(`Opening ${fileName}`)}
          />
        ))}
      </div>
    </>
  )
}

function generateDividerProps(props: DividerProps): ChatItem {
  const { content, important, color = 'secondary' } = props
  const dividerProps: Divider = { itemType: ChatItemTypes.divider, content, important, color }

  return { message: dividerProps }
}

export function generateChatProps(chat: ChatData): ChatItem[] {
  if (!chat || !chat.members || !chat.messages) {
    return []
  }

  const { messages, members } = chat
  const chatProps: ChatItem[] = []

  // First date divider
  chatProps.push(generateDividerProps({ content: getFriendlyDateString(messages[0].date) }))

  for (let i = 0; i < messages.length - 1; i++) {
    const [msg1, msg2] = [messages[i], messages[i + 1]]
    chatProps.push(generateChatMsgProps(msg1, members.get(msg1.from)))

    if (!areSameDay(msg1.date, msg2.date)) {
      // Generating divider when date changes
      chatProps.push(generateDividerProps({ content: getFriendlyDateString(msg2.date) }))
    }
  }

  const lastMsg = messages[messages.length - 1]
  chatProps.push(generateChatMsgProps(lastMsg, members.get(lastMsg.from)))

  // Last read divider
  const myLastMsgIndex = _.findLastIndex(chatProps, item => item.mine)
  if (myLastMsgIndex < chatProps.length - 1) {
    chatProps.splice(
      myLastMsgIndex + 1,
      0,
      generateDividerProps({ content: 'Last read', color: 'brand', important: true }),
    )
  }

  return chatProps
}
