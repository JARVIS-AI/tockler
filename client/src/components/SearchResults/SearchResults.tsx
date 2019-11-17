import { Box, Flex } from '@rebass/grid';
import { Button, Icon, Input, Table } from 'antd';
// tslint:disable-next-line: no-submodule-imports
import { PaginationConfig } from 'antd/lib/table';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import Moment from 'react-moment';
import { convertDate, DATE_TIME_FORMAT, INPUT_DATE_FORMAT, TIME_FORMAT } from '../../constants';
import { TrackItemType } from '../../enum/TrackItemType';
import { diffAndFormatShort } from '../../utils';
import { filterItems } from '../Timeline/timeline.utils';
import { FilterDropdown, FilterInput, Highlight, TotalCount } from './SearchResults.styles';
import { Logger } from '../../logger';
import { deleteByIds } from '../../services/trackItem.api';

const checkIfOneDay = visibleTimerange => visibleTimerange[0].isSame(visibleTimerange[1], 'day');

const calculateTotal = filteredData => {
    const totalMs = _.sumBy(filteredData, c =>
        convertDate(c.endDate).diff(convertDate(c.beginDate)),
    );
    const dur = moment.duration(totalMs);

    return <TotalCount>Total {dur.format()}</TotalCount>;
};

const paginationConf: PaginationConfig = {
    showSizeChanger: true,
    pageSizeOptions: ['50', '100', '300', '500'],
};

const deleteTimelineItems = ids => {
    Logger.debug('Delete timeline items', ids);

    if (ids) {
        deleteByIds(ids).then(() => {
            Logger.debug('Deleted timeline items', ids);
            // TODO: reload timerange or remove from timeline
        });
    } else {
        Logger.error('No ids, not deleting from DB');
    }
};

export const SearchResults = ({ dataItems }) => {
    const [state, setState] = React.useState<any>({
        filteredInfo: {},
        sortedInfo: {},
        filterDropdownVisible: false,
        activeType: TrackItemType.AppTrackItem,
        searchText: '',
        filtered: false,
        selectedRowKeys: [],
    });

    const searchInput = React.useRef<any>();

    React.useEffect(() => {
        if (searchInput.current) {
            searchInput.current.focus();
        }
    }, [state.filterDropdownVisible]);

    const handleChange = (pagination: any, filters: any, sorter: any) => {
        Logger.debug('Various parameters', pagination, filters, sorter);
        setState({ ...state, filteredInfo: filters, sortedInfo: sorter });
    };

    const onInputChange = e => {
        setState({ ...state, searchText: e.target.value });
    };

    const onSelectChange = selectedRowKeys => {
        Logger.debug('selectedRowKeys changed: ', selectedRowKeys);
        setState({ ...state, selectedRowKeys });
    };

    const deleteSelectedItems = () => {
        const { selectedRowKeys } = state;
        deleteTimelineItems(selectedRowKeys);
        setState({ ...state, selectedRowKeys: [] });
    };

    const { isOneDay, activeType, sortedInfo, filteredInfo } = state;

    const columns = [
        {
            title: 'App',
            dataIndex: 'app',
            key: 'app',
            width: 200,
            sorter: (a: any, b: any) => a.app - b.app,
            sortOrder: sortedInfo.columnKey === 'app' && sortedInfo.order,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',

            sorter: (a: any, b: any) => a.title.length - b.title.length,
            sortOrder: sortedInfo.columnKey === 'title' && sortedInfo.order,
        },
        {
            title: 'Begin',
            dataIndex: 'beginDate',
            key: 'beginDate',
            width: 170,
            onFilter: (value: any, record: any) => convertDate(record.beginDate) > value,
            sorter: (a: any, b: any) =>
                convertDate(a.beginDate).valueOf() - convertDate(b.beginDate).valueOf(),
            sortOrder: sortedInfo.columnKey === 'beginDate' && sortedInfo.order,
            render: (text, record) => (
                <Moment
                    format={isOneDay ? TIME_FORMAT : DATE_TIME_FORMAT}
                    parse={INPUT_DATE_FORMAT}
                >
                    {record.beginDate}
                </Moment>
            ),
        },
        {
            title: 'End',
            dataIndex: 'endDate',
            key: 'endDate',
            width: 170,
            onFilter: (value: any, record: any) => convertDate(record.endDate) > value,
            sorter: (a: any, b: any) =>
                convertDate(a.endDate).valueOf() - convertDate(b.endDate).valueOf(),
            sortOrder: sortedInfo.columnKey === 'endDate' && sortedInfo.order,

            render: (text, record) => (
                <Moment
                    format={isOneDay ? TIME_FORMAT : DATE_TIME_FORMAT}
                    parse={INPUT_DATE_FORMAT}
                >
                    {record.endDate}
                </Moment>
            ),
        },

        {
            title: 'Dur',
            dataIndex: '',
            key: 'duration',
            width: 80,
            sorter: (a: any, b: any) =>
                convertDate(a.endDate).diff(convertDate(a.beginDate)) -
                convertDate(b.endDate).diff(convertDate(b.beginDate)),
            sortOrder: sortedInfo.columnKey === 'duration' && sortedInfo.order,

            render: (text, record) => (
                <span>{diffAndFormatShort(record.beginDate, record.endDate)}</span>
            ),
        },
    ];

    const { selectedRowKeys } = state;
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    return (
        <Table
            rowSelection={rowSelection}
            rowKey={(record: any) => `${record.id}`}
            columns={columns}
            pagination={paginationConf}
            dataSource={dataItems}
            onChange={handleChange}
            footer={calculateTotal}
        />
    );
};