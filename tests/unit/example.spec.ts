import { mount } from '@vue/test-utils'
import Feed from '@/views/Feed.vue'

describe('Feed.vue', () => {
  it('affiche le fil musical', () => {
    const wrapper = mount(Feed)
    expect(wrapper.text()).toMatch('Ton fil musical')
  })
})
