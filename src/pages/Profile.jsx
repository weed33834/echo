import { defineComponent, ref, computed } from 'vue'
import {
  EchoCard,
  EchoButton,
  EchoBadge,
  EchoTag,
  EchoModal,
  showToast,
} from '@/components/EchoUI.jsx'
import { TopBar } from '@/components/TabBar.jsx'
import { useEchoStore } from '@/stores/echo.js'
import { BaziChart } from '@/components/BaziChart.jsx'
import { zodiacOf, zodiacSignOf, solarToLunar } from '@/utils/engines.js'
import { UIIcon } from '@/components/ToolIcons.jsx'

// 十二地支时辰选项（value 为该时辰起始小时，范围 0-23）
const TIME_SLOTS = [
  { label: '子时 (23-1)', value: 23 },
  { label: '丑时 (1-3)', value: 1 },
  { label: '寅时 (3-5)', value: 3 },
  { label: '卯时 (5-7)', value: 5 },
  { label: '辰时 (7-9)', value: 7 },
  { label: '巳时 (9-11)', value: 9 },
  { label: '午时 (11-13)', value: 11 },
  { label: '未时 (13-15)', value: 13 },
  { label: '申时 (15-17)', value: 15 },
  { label: '酉时 (17-19)', value: 17 },
  { label: '戌时 (19-21)', value: 19 },
  { label: '亥时 (21-23)', value: 21 },
]

// 主要城市出生地（含经度）
const BIRTH_PLACES = [
  { label: '北京 (116°E)', city: '北京', longitude: 116 },
  { label: '上海 (121°E)', city: '上海', longitude: 121 },
  { label: '广州 (113°E)', city: '广州', longitude: 113 },
  { label: '成都 (104°E)', city: '成都', longitude: 104 },
  { label: '西安 (109°E)', city: '西安', longitude: 109 },
  { label: '杭州 (120°E)', city: '杭州', longitude: 120 },
  { label: '武汉 (114°E)', city: '武汉', longitude: 114 },
  { label: '重庆 (107°E)', city: '重庆', longitude: 107 },
]

// 性别文案映射
const GENDER_TEXT = { male: '男', female: '女' }

export default defineComponent({
  name: 'Profile',
  setup() {
    const store = useEchoStore()

    // 弹窗显示与表单状态
    const showModal = ref(false)
    const form = ref({
      name: '',
      birthday: '',
      birthTime: '',
      gender: '',
      birthPlace: '',
      longitude: null,
    })

    // 仓库派生状态
    const profile = computed(() => store.profile || {})
    const profileBazi = computed(() => store.profileBazi)

    // 是否已设置档案（以是否有称呼为准）
    const hasProfile = computed(() => !!profile.value?.name)

    // 生肖
    const zodiac = computed(() => {
      if (!profile.value?.birthday) return ''
      try {
        const year = Number(profile.value.birthday.split('-')[0])
        if (!year) return ''
        return zodiacOf(year)
      } catch (e) {
        return ''
      }
    })

    // 星座
    const zodiacSign = computed(() => {
      if (!profile.value?.birthday) return ''
      try {
        const parts = profile.value.birthday.split('-').map(Number)
        const [, month, day] = parts
        if (!month || !day) return ''
        return zodiacSignOf(month, day)
      } catch (e) {
        return ''
      }
    })

    // 日主（天干）
    const dayMaster = computed(() => {
      if (!profileBazi.value) return ''
      return (
        profileBazi.value.dayMaster ||
        profileBazi.value.dayGan ||
        profileBazi.value.day?.gan ||
        ''
      )
    })

    // 农历
    const lunarDate = computed(() => {
      if (!profile.value?.birthday) return ''
      try {
        return solarToLunar(profile.value.birthday)
      } catch (e) {
        return ''
      }
    })

    // 纳音
    const nayin = computed(() => {
      if (!profileBazi.value) return ''
      return (
        profileBazi.value.nayin ||
        profileBazi.value.dayNayin ||
        profileBazi.value.day?.nayin ||
        ''
      )
    })

    // 时辰文案
    const birthTimeLabel = computed(() => {
      const t = profile.value?.birthTime
      if (t === '' || t === null || t === undefined) return ''
      const slot = TIME_SLOTS.find((s) => s.value === Number(t))
      return slot ? slot.label : ''
    })

    // 出生地文案
    const birthPlaceLabel = computed(() => {
      if (!profile.value?.birthPlace) return ''
      const place = BIRTH_PLACES.find(
        (p) => p.city === profile.value.birthPlace,
      )
      return place ? place.label : profile.value.birthPlace
    })

    // 打开「设置档案」弹窗（空状态）
    const openSetupModal = () => {
      form.value = {
        name: '',
        birthday: '',
        birthTime: '',
        gender: '',
        birthPlace: '',
        longitude: null,
      }
      showModal.value = true
    }

    // 打开「编辑档案」弹窗（回填已有数据）
    const openEditModal = () => {
      const p = profile.value || {}
      form.value = {
        name: p.name || '',
        birthday: p.birthday || '',
        birthTime: p.birthTime ?? '',
        gender: p.gender || '',
        birthPlace: p.birthPlace || '',
        longitude: p.longitude ?? null,
      }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
    }

    // 时辰下拉变更
    const onBirthTimeChange = (e) => {
      const v = e.target.value
      form.value.birthTime = v === '' ? '' : Number(v)
    }

    // 出生地下拉变更（同步经度）
    const onBirthPlaceChange = (e) => {
      const city = e.target.value
      const place = BIRTH_PLACES.find((p) => p.city === city)
      form.value.birthPlace = city
      form.value.longitude = place ? place.longitude : null
    }

    // 表单校验
    const validateForm = () => {
      if (!form.value.name || !form.value.name.trim()) {
        showToast('请输入称呼')
        return false
      }
      if (!form.value.birthday) {
        showToast('请选择出生日期')
        return false
      }
      if (!form.value.gender) {
        showToast('请选择性别')
        return false
      }
      return true
    }

    // 保存档案
    const handleSave = () => {
      if (!validateForm()) return
      const payload = {
        name: form.value.name.trim(),
        birthday: form.value.birthday,
        birthTime: form.value.birthTime,
        gender: form.value.gender,
        birthPlace: form.value.birthPlace,
        longitude: form.value.longitude,
      }
      store.setProfile(payload)
      showToast(hasProfile.value ? '档案已更新' : '档案已创建')
      showModal.value = false
    }

    // 空状态
    const renderEmpty = () => (
      <div class="profile-page__empty">
        <EchoCard class="profile-page__empty-card stagger" style={{ '--i': 0 }}>
          <div class="profile-page__empty-icon">
            <UIIcon name="profile" size={48} />
          </div>
          <h2 class="profile-page__empty-title">尚未设置个人档案</h2>
          <p class="profile-page__empty-desc">
            完善您的出生信息，让回响为您推演命理八字
          </p>
          <EchoButton type="primary" onClick={openSetupModal}>
            设置档案
          </EchoButton>
        </EchoCard>
      </div>
    )

    // 个人档案英雄卡
    const renderHero = () => (
      <EchoCard class="profile-page__hero stagger" style={{ '--i': 0 }}>
        <div class="profile-page__hero-top">
          <div class="profile-page__avatar">
            {profile.value?.name?.charAt(0) || '回'}
          </div>
          <div class="profile-page__hero-info">
            <h2 class="profile-page__name">{profile.value?.name}</h2>
            <div class="profile-page__badges">
              {zodiac.value && (
                <EchoBadge type="primary">{`生肖 ${zodiac.value}`}</EchoBadge>
              )}
              {zodiacSign.value && (
                <EchoBadge type="info">{`星座 ${zodiacSign.value}`}</EchoBadge>
              )}
              {dayMaster.value && (
                <EchoBadge type="success">{`日主 ${dayMaster.value}`}</EchoBadge>
              )}
            </div>
          </div>
        </div>
        <div class="profile-page__hero-actions">
          <EchoButton size="small" onClick={openEditModal}>
            编辑档案
          </EchoButton>
        </div>
      </EchoCard>
    )

    // 档案信息网格
    const renderInfoGrid = () => {
      const items = [
        { label: '生辰', value: profile.value?.birthday || '—' },
        { label: '时辰', value: birthTimeLabel.value || '未知' },
        { label: '性别', value: GENDER_TEXT[profile.value?.gender] || '—' },
        { label: '出生地', value: birthPlaceLabel.value || '—' },
        { label: '农历', value: lunarDate.value || '—' },
        { label: '生肖', value: zodiac.value || '—' },
        { label: '星座', value: zodiacSign.value || '—' },
        { label: '纳音', value: nayin.value || '—' },
      ]
      return (
        <EchoCard class="profile-page__info stagger" style={{ '--i': 2 }}>
          <div class="profile-page__info-grid">
            {items.map((item) => (
              <div class="profile-page__info-item" key={item.label}>
                <span class="profile-page__info-label">{item.label}</span>
                <span class="profile-page__info-value">{item.value}</span>
              </div>
            ))}
          </div>
        </EchoCard>
      )
    }

    // 编辑/设置表单
    const renderForm = () => (
      <div class="profile-page__form">
        <div class="profile-page__form-item">
          <label class="profile-page__form-label">称呼</label>
          <input
            class="profile-page__form-input"
            type="text"
            v-model={form.value.name}
            placeholder="请输入您的称呼"
            maxlength="20"
          />
        </div>

        <div class="profile-page__form-item">
          <label class="profile-page__form-label">出生日期</label>
          <input
            class="profile-page__form-input"
            type="date"
            v-model={form.value.birthday}
            min="1900-01-01"
            max="2100-12-31"
          />
        </div>

        <div class="profile-page__form-item">
          <label class="profile-page__form-label">出生时辰</label>
          <select
            class="profile-page__form-input"
            value={
              form.value.birthTime === '' ||
              form.value.birthTime === null ||
              form.value.birthTime === undefined
                ? ''
                : String(form.value.birthTime)
            }
            onChange={onBirthTimeChange}
          >
            <option value="">未知（暂不填写）</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={String(slot.value)}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div class="profile-page__form-item">
          <label class="profile-page__form-label">性别</label>
          <div class="profile-page__form-gender">
            <EchoButton
              size="small"
              type={form.value.gender === 'male' ? 'primary' : 'default'}
              onClick={() => {
                form.value.gender = 'male'
              }}
            >
              男
            </EchoButton>
            <EchoButton
              size="small"
              type={form.value.gender === 'female' ? 'primary' : 'default'}
              onClick={() => {
                form.value.gender = 'female'
              }}
            >
              女
            </EchoButton>
          </div>
        </div>

        <div class="profile-page__form-item">
          <label class="profile-page__form-label">出生地</label>
          <select
            class="profile-page__form-input"
            value={form.value.birthPlace || ''}
            onChange={onBirthPlaceChange}
          >
            <option value="">请选择出生地</option>
            {BIRTH_PLACES.map((place) => (
              <option key={place.city} value={place.city}>
                {place.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    )

    return () => (
      <div class="profile-page">
        <TopBar title="个人档案" back />

        <div class="profile-page__content">
          {!hasProfile.value ? (
            renderEmpty()
          ) : (
            <div class="profile-page__body">
              {renderHero()}

              {profileBazi.value && (
                <div class="profile-page__bazi stagger" style={{ '--i': 1 }}>
                  <BaziChart bazi={profileBazi.value} />
                </div>
              )}

              {renderInfoGrid()}

              <div class="profile-page__hint stagger" style={{ '--i': 3 }}>
                <EchoTag variant="muted">提示</EchoTag>
                <span class="profile-page__hint-text">
                  填写出生时辰可显著提升推算准确度
                </span>
              </div>
            </div>
          )}
        </div>

        <EchoModal
          modelValue={showModal.value}
          onUpdate:modelValue={(v) => showModal.value = v}
          title={hasProfile.value ? '编辑档案' : '设置档案'}
          vSlots={{
            default: () => renderForm(),
            footer: () => (
              <>
                <EchoButton variant="ghost" size="sm" onClick={() => showModal.value = false}>取消</EchoButton>
                <EchoButton variant="primary" size="sm" onClick={handleSave}>保存</EchoButton>
              </>
            )
          }}
        />
      </div>
    )
  },
})
