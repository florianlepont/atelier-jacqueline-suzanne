import {Badge} from '@sanity/ui'
import {type ObjectItemProps} from 'sanity'

/**
 * Shared array-item renderer for the `images` field on both `gallery.ts` and
 * `edition.ts`. Purely a presentation overlay -- the first element of the
 * `images` array has always been the de facto cover photo (communicated only
 * via field description text until now), and this component makes that fact
 * visible in the Studio grid without adding any schema field. Quick task
 * 260801-kgh (commit `cd77e27`) just removed Édition's dedicated cover field
 * to unify on this "first array element" convention -- do not reintroduce a
 * dedicated field here.
 *
 * `props.index` (rather than deriving position from `props.path` +
 * `useFormValue` + comparing `_key`) is used to detect the first item because
 * `BaseItemProps.index` is provided directly by the Studio for every array
 * item -- see 260801-pn7-PLAN.md's `<api_findings>` for the verified typings.
 */
export function PrimaryPhotoItem(props: ObjectItemProps) {
  const isPrimaryPhoto = props.index === 0

  if (!isPrimaryPhoto) {
    return props.renderDefault(props)
  }

  return (
    <div style={{position: 'relative'}}>
      {props.renderDefault(props)}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          pointerEvents: 'none',
          zIndex: 1,
        }}
        title="Cette photo sert de couverture"
      >
        <Badge fontSize={0} tone="primary" mode="default">
          Couverture
        </Badge>
      </div>
    </div>
  )
}
