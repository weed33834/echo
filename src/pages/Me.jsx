import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoModal, MingeGauge, showToast } from '@/components/EchoUI.jsx'
import { UIIcon } from '@/components/ToolIcons.jsx'

export default defineComponent({
  name: 'Me',
  setup() {
    const router = useRouter()
    const store = useEchoStore()

    // 档案编辑弹窗
    const profileModal = ref(false)
    const profileForm = ref({ name: '', birthday: '', gender: 'male' })

    const openProfileEdit = () => {
      profileForm.value = {
        name: store.profile?.name || '',
        birthday: store.profile?.birthday || '',
        gender: store.profile?.gender || 'male'
      }
      profileModal.value = true
    }

    const saveProfile = () => {
      if (!profileForm.value.name.trim()) {
        showToast('请填写称呼', 'warn')
        return
      }
      store.setProfile({
        name: profileForm.value.name.trim(),
        birthday: profileForm.value.birthday,
        gender: profileForm.value.gender
      })
      showToast('档案已保存', 'success', 1500)
      profileModal.value = false
    }

    const genderLabel = (g) => g === 'female' ? '女' : '男'

    const zodiacOf = (birthday) => {
      if (!birthday) return null
      const y = Number(birthday.split('-')[0])
      if (!y || y < 4) return null
      const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
      return animals[((y - 4) % 12 + 12) % 12]
    }

    // 菜单图标样式
    const menuIconStyle = { color: 'var(--muted)' }
    const menuLabelStyle = { display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-3)' }

    return () => (
      <div class="me-page">
        <TopBar title="我的" />
        <div class="container">
          {/* 命格档案 */}
          <EchoCard level="primary" class="stagger" style={{ '--i': 0 }}>
            <div class="me-page__profile">
              <MingeGauge value={store.accuracyRate} />
              <div class="me-page__profile-info">
                <div class="me-page__name">{store.profile?.name || 'Echo 探索者'}</div>
                <div class="me-page__title">
                  <EchoBadge variant="gold">Lv.{store.minge.level} {store.mingeLevelTitle}</EchoBadge>
                </div>
                <div class="me-page__stats">
                  <span>{store.minge.totalReviews} 印证</span>
                  <span>·</span>
                  <span>{store.accuracyRate}% 应验</span>
                </div>
                <EchoButton variant="ghost" size="sm" onClick={openProfileEdit}>编辑档案</EchoButton>
              </div>
            </div>
          </EchoCard>

          {/* 档案详情（已设置时显示） */}
          {store.profile?.birthday && (
            <EchoCard level="tertiary" class="stagger" style={{ '--i': 1 }}>
              <div class="me-page__profile-detail">
                <div class="me-page__detail-row">
                  <span class="me-page__detail-label">生辰</span>
                  <span class="me-page__detail-val">{store.profile.birthday}</span>
                </div>
                <div class="me-page__detail-row">
                  <span class="me-page__detail-label">性别</span>
                  <span class="me-page__detail-val">{genderLabel(store.profile.gender)}</span>
                </div>
                {store.profileBazi?.dayMasterLabel && (
                  <div class="me-page__detail-row">
                    <span class="me-page__detail-label">日主</span>
                    <EchoTag variant="gold">{store.profileBazi.dayMasterLabel}</EchoTag>
                  </div>
                )}
                {zodiacOf(store.profile.birthday) && (
                  <div class="me-page__detail-row">
                    <span class="me-page__detail-label">生肖</span>
                    <span class="me-page__detail-val">属{zodiacOf(store.profile.birthday)}</span>
                  </div>
                )}
              </div>
            </EchoCard>
          )}

          {/* 数据统计 */}
          <div class="me-page__stats-grid stagger" style={{ '--i': 2 }}>
            <EchoCard level="tertiary">
              <div class="me-page__stat">
                <div class="me-page__stat-num">{store.assumptions.length}</div>
                <div class="me-page__stat-lbl">总预测</div>
              </div>
            </EchoCard>
            <EchoCard level="tertiary">
              <div class="me-page__stat">
                <div class="me-page__stat-num">{store.pendingAssumptions.length}</div>
                <div class="me-page__stat-lbl">待印证</div>
              </div>
            </EchoCard>
            <EchoCard level="tertiary">
              <div class="me-page__stat">
                <div class="me-page__stat-num">{store.checkin.streak}</div>
                <div class="me-page__stat-lbl">连签</div>
              </div>
            </EchoCard>
          </div>

          {/* 菜单 */}
          <EchoCard level="secondary" class="stagger" style={{ '--i': 3 }}>
            <div class="me-page__menu">
              <button class="me-page__menu-item" onClick={() => router.push('/profile')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="profile" size={18} style={menuIconStyle} />
                  个人档案
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/graph')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="graph" size={18} style={menuIconStyle} />
                  命运图谱
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/dashboard')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="dashboard" size={18} style={menuIconStyle} />
                  命格面板
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/compatibility')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="compatibility" size={18} style={menuIconStyle} />
                  合婚匹配
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/learn')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="learn" size={18} style={menuIconStyle} />
                  命理学堂
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/echo')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="compass" size={18} style={menuIconStyle} />
                  印证中心
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/checkin')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="checkin" size={18} style={menuIconStyle} />
                  每日签到
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/daily')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="daily" size={18} style={menuIconStyle} />
                  每日渡
                </span>
              </button>
              <button class="me-page__menu-item" onClick={() => router.push('/settings')}>
                <span class="me-page__menu-label" style={menuLabelStyle}>
                  <UIIcon name="settings" size={18} style={menuIconStyle} />
                  设置
                </span>
              </button>
            </div>
          </EchoCard>

          {/* 危险区 */}
          <EchoCard level="tertiary" class="stagger" style={{ '--i': 4 }}>
            <div class="me-page__danger">
              <div class="me-page__danger-title">重置数据</div>
              <p class="me-page__danger-desc">清空所有预测与印证记录，命格等级归零。此操作不可恢复。</p>
              <EchoButton variant="danger" size="sm" onClick={() => {
                if (confirm('确定重置所有数据？此操作不可恢复。')) {
                  store.resetAll()
                  location.reload()
                }
              }}>重置</EchoButton>
            </div>
          </EchoCard>

          <div class="me-page__footer stagger" style={{ '--i': 5 }}>
            <div class="me-page__brand">Echo · 回响</div>
            <div class="me-page__version">v0.2.0 · 发起预测，等待回响</div>
          </div>
        </div>

        {/* 档案编辑弹窗 */}
        <EchoModal
          modelValue={profileModal.value}
          onUpdate:modelValue={(v) => profileModal.value = v}
          title="编辑档案"
          vSlots={{
            default: () => (
              <div class="profile-form">
                <div class="profile-form__field">
                  <label class="profile-form__label">称呼</label>
                  <input
                    class="profile-form__input"
                    type="text"
                    value={profileForm.value.name}
                    onInput={(e) => profileForm.value.name = e.target.value}
                    placeholder="如何称呼你"
                    maxlength="12"
                  />
                </div>
                <div class="profile-form__field">
                  <label class="profile-form__label">出生日期</label>
                  <input
                    class="profile-form__input"
                    type="date"
                    value={profileForm.value.birthday}
                    onInput={(e) => profileForm.value.birthday = e.target.value}
                    min="1900-01-01"
                    max="2100-12-31"
                  />
                  <p class="profile-form__hint">用于推算日主与生肖，仅本地存储</p>
                </div>
                <div class="profile-form__field">
                  <label class="profile-form__label">性别</label>
                  <div class="profile-form__gender">
                    <button
                      class={`profile-form__gender-btn ${profileForm.value.gender === 'male' ? 'profile-form__gender-btn--active' : ''}`}
                      onClick={() => profileForm.value.gender = 'male'}
                    >男</button>
                    <button
                      class={`profile-form__gender-btn ${profileForm.value.gender === 'female' ? 'profile-form__gender-btn--active' : ''}`}
                      onClick={() => profileForm.value.gender = 'female'}
                    >女</button>
                  </div>
                </div>
              </div>
            ),
            footer: () => [
              <EchoButton variant="ghost" onClick={() => profileModal.value = false}>取消</EchoButton>,
              <EchoButton variant="primary" onClick={saveProfile}>保存</EchoButton>
            ]
          }}
        />
      </div>
    )
  }
})
