import { 
    reactive, ref, readonly, 
    InjectionKey, provide, inject, 
    Ref, onUnmounted, computed 
} from 'vue'

interface TabData {
  title?: string;
  icon?: string;
  active?: boolean;
  dark?: boolean;
}

const tabsInjectionKey = Symbol('tabs') as InjectionKey<{
  registerTab: (identifier: symbol, tabData: TabData) => void,
  deregisterTab: (identifier: symbol) => void
  activeTab: Readonly<Ref<symbol | undefined>>,
}>

export const useTabs = () => {
  const tabs = reactive(new Map<symbol, TabData>())

  const registerTab = (identifier: symbol, tabData: TabData) => {
    tabs.set(identifier, tabData);
    
    if (tabs.size === 1) {
        setActiveTab(identifier);
    }
  }

  const deregisterTab = (identifier: symbol) => {
    tabs.delete(identifier)
  }

  const activeTab = ref<symbol | undefined>();

  provide(tabsInjectionKey, {
    registerTab,
    deregisterTab,
    activeTab: readonly(activeTab),
  })

  const setActiveTab = (identifier: symbol) => {
    activeTab.value = identifier

    for(const [id, data] of tabs) {
        data.active = id === identifier
    }
  }

  return {
    tabs: readonly(tabs),
    setActiveTab,
  }
}

export const useTab = (tabData: TabData) => {
  const tabsInjection = inject(tabsInjectionKey)

  if (!tabsInjection) {
    throw new Error('Tabs were not provided')
  }

  const { registerTab, deregisterTab, activeTab } = tabsInjection

  const tabSymbol = Symbol(tabData.title);

  registerTab(tabSymbol, tabData)

  onUnmounted(() => {
    deregisterTab(tabSymbol)
  })

  const isActive = computed(() => (
    activeTab.value === tabSymbol
  ))

  return {
    isActive,
  }
}