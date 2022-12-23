import React, { useMemo } from 'react'

import c from 'classnames'
import { ImgDefault } from '@ecom/auxo'
import { DouXiaoerStatusEnum, setGlobalHide } from '@ecom/hulk-utils/src/dou-xiaoer'
import { getGlobalStore } from '@ecom/hulk-utils/src/store'
import { sendEvent } from '@ecom/hulk-utils/src/tea'
import { useContextStore } from '@ecom/mortise/YStore'

import { UnionIcon } from '../../../static/icon'
import DouXiaoerStore from '../../../store'
import { CommonStyle, IDouXiaoerContent, IHeadInfo } from '../../../type'
import { AccurateHeaderType } from '../../../type/accurate'
import { DouxiaoerClickEvent } from '../../../utils'
import { useRecommendTheme } from '../../../utils/hooks/useTheme'
import { DEFAULT_THEME, HEADER_IMG } from '../../../utils/imgs'
import { isSupportedWebp } from '../../../utils/webp'

import s from './index.scss'

export interface TodoHeaderProps extends CommonStyle {
  className?: string
  todoLength?: number
}

export const TodoHeader = ({ className, todoLength, normalImg }: TodoHeaderProps) => {
  const { action } = useContextStore(DouXiaoerStore)

  return (
    <div className={c(s.todoHeader, className)}>
      <div className={s.todo}>
        <div className={s.infoWrapper}>
          <ImgDefault
            imgSrc={normalImg ? normalImg : HEADER_IMG.HIGHEST_P}
            defaultSvg={HEADER_IMG.LOWEST_P}
            mask={false}
            className={s.infoImg}
            draggable={'false'}
          />
          {Boolean(todoLength) ? (
            <div className={s.info}>
              <div className={s.title}>有 {todoLength} 个事项正在影响您的收益</div>
              <div className={s.subTitle}>请及时关注，按指导完成操作</div>
            </div>
          ) : (
            <div className={s.nonTaskInfo}>很棒～当前没有需要处理的任务</div>
          )}
        </div>

        <div
          className={s.miniIcon}
          onClick={() => {
            if (getGlobalStore().getData?.()?.DouXiaoerStore?.isOnceInject) {
              // 如果页面中存在嵌入式，需要直接隐藏
              setGlobalHide(true)
            }

            action.sendChangeToMini()
            action.setDouXiaoerStatus(DouXiaoerStatusEnum.mini)
          }}
        >
          <UnionIcon />
        </div>
      </div>
    </div>
  )
}

export interface RecommendHeaderProps extends CommonStyle {
  className?: string
  type?: AccurateHeaderType
}

export const RecommendHeader = ({ className, normalImg, normalBg, type }: RecommendHeaderProps) => {
  const { state, action } = useContextStore(DouXiaoerStore)
  const { content = {} as IDouXiaoerContent, themeInfo } = state
  const { head_info = {} as IHeadInfo } = content

  const { theme } = useRecommendTheme()

  return (
    <div
      className={c(s.recommendHeader, className, {
        [s.recommendInSearch]: type === AccurateHeaderType.搜索
      })}
      // style={{ backgroundImage: `url(${normalBg ? normalBg : HEADER_IMG.HEADER_BG})` }}>
      style={{ backgroundImage: `url(${normalBg ? normalBg : theme.img_header})` }}
    >
      <div className={s.recommend} />
      <div className={s.recommend}>
        <div className={s.recommendContent}>
          <ImgDefault
            imgSrc={normalImg ? normalImg : isSupportedWebp() ? theme.src : theme.defaultSrc}
            defaultSvg={theme.defaultSrc}
            mask={false}
            className={s.nicon}
            draggable="false"
          />
          <div className={s.headerTitle}>
            <div className={s.title}>{head_info?.title}</div>
            {/* {Boolean(head_info?.location_text) && <div className={s.subTitle}>{head_info?.location_text}</div>} */}
          </div>
        </div>
        <div
          className={s.union}
          onClick={() => {
            sendEvent(DouxiaoerClickEvent, {
              scene_id: state.scene_id,
              status: state.status,
              name: '缩小按钮'
            })
            action.setDouXiaoerStatus(DouXiaoerStatusEnum.mini)
            action.sendChangeToMini()
          }}
        >
          <UnionIcon />
        </div>
      </div>
    </div>
  )
}

export interface SearchHeaderProps extends CommonStyle {
  className?: string
  type: AccurateHeaderType
}

export const SearchHeader = ({ className, type, normalImg, normalBg }: SearchHeaderProps) => {
  const { state, action } = useContextStore(DouXiaoerStore)
  const { theme } = useRecommendTheme()

  return (
    <div
      className={c(s.searchHeader, className, {
        [s.searchWithoutRecommend]: type !== AccurateHeaderType.搜索
      })}
    >
      <div className={s.search}>
        <div
          className={s.searchUnion}
          onClick={() => {
            sendEvent(DouxiaoerClickEvent, {
              scene_id: state.scene_id,
              status: state.status,
              name: '缩小按钮'
            })
            action.setDouXiaoerStatus(DouXiaoerStatusEnum.mini)
            action.sendChangeToMini()
          }}
        >
          <UnionIcon />
        </div>
        <ImgDefault
          imgSrc={normalImg ? normalImg : theme.search_png}
          defaultSvg={theme.search_png}
          mask={false}
          className={s.searchIcon}
          draggable="false"
        />
      </div>
    </div>
  )
}

export interface ContainerHeaderProps extends CommonStyle {
  className?: string
  hasP0: boolean
  // showTodo: boolean;
  type: AccurateHeaderType
  todoLength?: number
}

export default function ContainerHeader({ type, hasP0, ...props }: ContainerHeaderProps) {
  const showTodo = useMemo(() => type === AccurateHeaderType.待办, [type])
  const url = !showTodo ? '' : hasP0 ? HEADER_IMG.HIGHEST_P_BG : HEADER_IMG.LOWEST_P_BG

  return (
    <div
      className={c(s.headerContainer, {
        [s.todoContainer]: showTodo
        // [s.highestPWrapper]: showTodo && hasP0,
        // [s.lowestPWrapper]: showTodo && !hasP0,
      })}
      style={
        !url
          ? {}
          : {
              backgroundImage: `url(${url})`
            }
      }
    >
      {showTodo ? (
        <TodoHeader
          {...props}
          normalImg={
            Boolean(props.todoLength) ? (hasP0 ? HEADER_IMG.HIGHEST_P : HEADER_IMG.LOWEST_P) : HEADER_IMG.NO_TASK
          }
        />
      ) : (
        <>
          <RecommendHeader key={1} type={type} {...props} />
          <SearchHeader key={2} type={type} {...props} />
        </>
      )}
    </div>
  )
}
