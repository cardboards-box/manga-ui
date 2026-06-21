<template>
    <Error v-if="!isAdmin" message="Profile administration is not available." />
    <SearchList
        v-else
        title="Profiles"
        :items="profiles"
        :pending="pending"
        :error="rawError?.message"
        allow-reload
        hide-back
        :pagination="{
            page: filter.page ?? 1,
            pages,
            size: filter.size ?? DEFAULT_SIZE,
            total
        }"
        @reload="() => refresh()"
        @load-page="(page) => updateRoute({ page })"
        @headerstuck="(value) => headerStuck = value"
    >
        <template #header>
            <InputGroup
                v-model="searchFilters.search"
                placeholder="Search profiles"
                :stuck="headerStuck"
                @search="doSearch"
                is-drawer
            >
                <template #input>
                    <label>({{ profiles.length }} / {{ total }})</label>
                </template>

                <div class="admin-filters">
                    <div class="filter-row">
                        <label>Provider:</label>
                        <select v-model="searchFilters.provider">
                            <option :value="undefined">All</option>
                            <option v-for="provider in providers" :key="provider" :value="provider">{{ provider }}</option>
                        </select>
                    </div>

                    <div class="filter-block">
                        <label>Admin Status:</label>
                        <ButtonGroupOne :options="statusOptions" v-model="searchFilters.admin" />
                    </div>

                    <div class="filter-block">
                        <label>Approval Status:</label>
                        <ButtonGroupOne :options="statusOptions" v-model="searchFilters.canRead" />
                    </div>

                    <div class="flex align-left">
                        <button class="icon-btn" @click="clearFilters()">
                            <Icon>delete</Icon>
                            <p>Clear</p>
                        </button>
                        <button class="icon-btn" @click="doSearch()">
                            <Icon>search</Icon>
                            <p>Search</p>
                        </button>
                    </div>
                </div>
            </InputGroup>
        </template>

        <template #default="{ item }">
            <Card
                :title="item.username"
                :cover="item.avatar"
                :style="listStyle"
                leave-url-alone
                no-mask
            >
                <template #title v-if="listStyle === ListStyle.Expanded">
                    <div class="profile-actions">
                        <CheckBox
                            label="Admin"
                            :model-value="item.admin"
                            :disabled="isUpdating(item.id) || isSelf(item)"
                            @update:model-value="(value) => updateAdmin(item, value)"
                        />
                        <CheckBox
                            label="Approved"
                            :model-value="item.canRead"
                            :disabled="isUpdating(item.id)"
                            @update:model-value="(value) => updateApproval(item, value)"
                        />
                    </div>
                </template>

                <CardLine title="Email" :style="listStyle">{{ item.email }}</CardLine>
                <CardLine title="Provider" :style="listStyle">{{ item.provider }} / {{ item.providerId }}</CardLine>
                <CardLine title="Profile ID" :style="listStyle">{{ item.id }}</CardLine>
                <CardLine title="Joined" :style="listStyle"><Date :date="item.createdAt" format="r" /></CardLine>
                <CardLine title="Updated" :style="listStyle"><Date :date="item.updatedAt" format="r" /></CardLine>

                <CardTags title="Permissions" :style="listStyle">
                    <span v-if="item.admin" class="profile-tag">Admin</span>
                    <span v-if="item.canRead" class="profile-tag">Approved</span>
                </CardTags>

                <template #description>
                    <p v-if="actionError[item.id]" class="profile-error">{{ actionError[item.id] }}</p>
                    <div v-if="listStyle !== ListStyle.Expanded" class="profile-compact-actions">
                        <CheckBox
                            label="Admin"
                            :model-value="item.admin"
                            :disabled="isUpdating(item.id) || isSelf(item)"
                            @update:model-value="(value) => updateAdmin(item, value)"
                        />
                        <CheckBox
                            label="Approved"
                            :model-value="item.canRead"
                            :disabled="isUpdating(item.id)"
                            @update:model-value="(value) => updateApproval(item, value)"
                        />
                    </div>
                </template>
            </Card>
        </template>
    </SearchList>
</template>

<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router';
import { ListStyle, ProfileOrderBy } from '~/models';
import type { MbProfile, ProfileSearchFilter } from '~/models';

const DEFAULT_SIZE = 20;

type QueryValue = LocationQueryValue | LocationQueryValue[] | null | undefined;
type ProfileSearchDraft = {
    page: number;
    size: number;
    search: string;
    provider?: string;
    admin?: boolean;
    canRead?: boolean;
};

const api = useMangaApi();
const route = useRoute();
const router = useRouter();
const { listStyle } = useAppSettings();
const { isAdmin, currentUser } = useAuthHelper();

const statusOptions: { name: string; value: boolean | undefined }[] = [
    { name: 'All', value: undefined },
    { name: 'Yes', value: true },
    { name: 'No', value: false },
];

const headerStuck = ref(false);
const updating = ref<Record<string, boolean>>({});
const actionError = ref<Record<string, string>>({});
const searchFilters = ref(parseFilters());
const filter = computed<ProfileSearchFilter>(() => toApiFilter(parseFilters()));

const { data: providerData } = useAsyncData(
    'admin-profile-providers',
    async () => {
        if (!isAdmin.value) return [];

        const result = await api.promise.profile.providers();
        return api.isSuccess(result) ? api.data(result) ?? [] : [];
    },
    { watch: [() => isAdmin.value] }
);

const { data, pending, error: rawError, refresh } = useAsyncData(
    'admin-profile-search',
    async () => {
        if (!isAdmin.value) return { data: [], total: 0, pages: 0 };

        const result = await api.promise.profile.search(filter.value);
        const message = api.errorMessage(result);
        if (message) throw new Error(message);

        return api.data(result) ?? { data: [], total: 0, pages: 0 };
    },
    { watch: [() => route.query, () => isAdmin.value] }
);

const profiles = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const pages = computed(() => data.value?.pages ?? 0);
const providers = computed(() => providerData.value ?? []);

const doSearch = () => updateRoute({ ...searchFilters.value, page: 1 });

const clearFilters = () => updateRoute({
    page: 1,
    size: filter.value.size ?? DEFAULT_SIZE,
    search: '',
    provider: undefined,
    admin: undefined,
    canRead: undefined,
});

const updateRoute = (merge: Partial<ProfileSearchDraft>) => {
    const next: ProfileSearchDraft = {
        ...parseFilters(),
        ...merge,
    };

    router.push({
        path: '/admin',
        query: toQuery(next),
    });
};

const updateAdmin = async (profile: MbProfile, value: boolean) => {
    if (isSelf(profile) && !value) return;
    await updateProfile(profile, value, (id, next) => api.promise.profile.admin(id, next));
};

const updateApproval = async (profile: MbProfile, value: boolean) => {
    await updateProfile(profile, value, (id, next) => api.promise.profile.canRead(id, next));
};

const updateProfile = async (
    profile: MbProfile,
    value: boolean,
    request: (id: string, value: boolean) => ReturnType<typeof api.promise.profile.admin>
) => {
    actionError.value = { ...actionError.value, [profile.id]: '' };
    updating.value = { ...updating.value, [profile.id]: true };

    try {
        const result = await request(profile.id, value);
        const message = api.errorMessage(result);
        if (message) {
            actionError.value = { ...actionError.value, [profile.id]: message };
            return;
        }

        const updated = api.data(result);
        if (updated) replaceProfile(updated);
    } finally {
        updating.value = { ...updating.value, [profile.id]: false };
    }
};

const replaceProfile = (profile: MbProfile) => {
    if (currentUser.value?.id === profile.id) currentUser.value = profile;
    if (!data.value) return;

    data.value = {
        ...data.value,
        data: data.value.data.map(item => item.id === profile.id ? profile : item),
    };
};

const isUpdating = (id: string) => updating.value[id] ?? false;
const isSelf = (profile: MbProfile) => currentUser.value?.id === profile.id;

const toApiFilter = (draft: ProfileSearchDraft): ProfileSearchFilter => ({
    page: draft.page,
    size: draft.size,
    search: draft.search,
    providers: draft.provider ? [draft.provider] : undefined,
    admin: draft.admin,
    canRead: draft.canRead,
    order: ProfileOrderBy.CreatedAt,
    asc: false,
});

function parseFilters(): ProfileSearchDraft {
    return {
        page: numberQuery(route.query.page, 1),
        size: numberQuery(route.query.size, DEFAULT_SIZE),
        search: stringQuery(route.query.search) ?? '',
        provider: stringQuery(route.query.provider),
        admin: booleanQuery(route.query.admin),
        canRead: booleanQuery(route.query.canRead),
    };
}

const toQuery = (draft: ProfileSearchDraft) => {
    const query: Record<string, string> = {
        page: draft.page.toString(),
        size: draft.size.toString(),
    };

    if (draft.search?.trim()) query.search = draft.search.trim();
    if (draft.provider) query.provider = draft.provider;
    if (draft.admin !== undefined) query.admin = draft.admin.toString();
    if (draft.canRead !== undefined) query.canRead = draft.canRead.toString();

    return query;
};

function stringQuery(value: QueryValue) {
    const parsed = Array.isArray(value) ? value[0] : value;
    return parsed?.toString() || undefined;
}

function numberQuery(value: QueryValue, fallback: number) {
    const parsed = Number(stringQuery(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanQuery(value: QueryValue) {
    const parsed = stringQuery(value)?.toLocaleLowerCase();
    if (parsed === 'true') return true;
    if (parsed === 'false') return false;
    return undefined;
}

watch(() => route.query, () => {
    searchFilters.value = parseFilters();
}, { deep: true });
</script>

<style lang="scss" scoped>
.admin-filters {
    padding-bottom: var(--margin);

    .filter-row,
    .filter-block {
        margin: var(--margin) 0;
    }

    .filter-row {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        gap: 10px;

        select {
            min-width: 180px;
        }
    }
}

.profile-actions {
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
    margin-left: var(--margin);
    font-size: 1rem;
}

.profile-error {
    margin: 0;
    color: var(--color-warning);
}

.profile-compact-actions {
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
    margin-top: 8px;
}

.profile-tag {
    display: inline-flex;
    margin: 2px 5px 2px 0;
    padding: 2px 6px;
    border-radius: var(--brd-radius);
    background-color: var(--color-primary);
}
</style>
