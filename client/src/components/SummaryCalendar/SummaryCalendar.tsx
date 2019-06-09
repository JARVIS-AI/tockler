import * as React from 'react';
import { Calendar, Badge, Spin } from 'antd';
import { Flex } from '@rebass/grid';
import { TaskList, Item } from './SummaryCalendar.styles';
import moment, { Moment } from 'moment';
import { Spinner } from '../Timeline/Timeline.styles';
import { TrackItemService } from '../../services/TrackItemService';
import { TimelineContext } from '../../TimelineContext';
import { summariseLog, summariseOnline } from './SummaryCalendar.util';
import useReactRouter from 'use-react-router';

export const SummaryCalendar = () => {
    const { setTimerange } = React.useContext(TimelineContext);

    const { history } = useReactRouter();

    const onDateSelect = (selectedDate: Moment | undefined) => {
        const pathname = '/app/timeline';
        if (selectedDate) {
            setTimerange([selectedDate.startOf('day'), selectedDate.endOf('day')]);
            history.push(pathname);
        } else {
            console.error('No date');
        }

        // setPath
    };
    const [isLoading, setIsLoading] = React.useState<any>(false);
    const [selectedDate, setSelectedDate] = React.useState<any>(moment());
    const [selectedMode, setSelectedMode] = React.useState<any>('month');
    const [logSummary, setLogSummary] = React.useState<any>([]);
    const [onlineSummary, setOnlineSummary] = React.useState<any>([]);

    React.useEffect(() => {
        setIsLoading(true);
        const beginDate = moment(selectedDate).startOf(selectedMode);
        const endDate = moment(selectedDate).endOf(selectedMode);

        TrackItemService.findAllItems(beginDate, endDate).then(
            ({ appItems, statusItems, logItems }) => {
                setLogSummary(summariseLog(logItems, selectedMode));
                setOnlineSummary(summariseOnline(statusItems, selectedMode));
                setIsLoading(false);
            },
        );
    }, [selectedDate, selectedMode]);

    const changeSelectedDate = (date?: Moment, mode?: 'month' | 'year') => {
        setSelectedDate(date);
        setSelectedMode(mode);
    };

    const getListData = day => {
        let listData: Array<any> = [];
        const worked = logSummary[day];
        if (worked) {
            let formattedDuration = moment.duration(worked).format();
            listData.push({ type: 'warning', content: `Worked: ${formattedDuration}` });
        }

        const online = onlineSummary[day];
        if (online) {
            let formattedDuration = moment.duration(online).format();
            listData.push({ type: 'success', content: `Online: ${formattedDuration}` });
        }

        return listData || [];
    };

    const dateCellRender = value => {
        if (value.month() === selectedDate.month()) {
            const listData = getListData(value.date());
            return (
                <TaskList>
                    {listData.map(item => (
                        <Item key={item.content}>
                            <Badge status={item.type} text={item.content} />
                        </Item>
                    ))}
                </TaskList>
            );
        }
        return null;
    };

    const monthCellRender = value => {
        const listData = getListData(value.month());
        return (
            <TaskList>
                {listData.map(item => (
                    <Item key={item.content}>
                        <Badge status={item.type} text={item.content} />
                    </Item>
                ))}
            </TaskList>
        );
    };

    return (
        <Flex p={1}>
            {isLoading && (
                <Spinner>
                    <Spin />
                </Spinner>
            )}
            <Calendar
                value={selectedDate}
                mode={selectedMode}
                onSelect={onDateSelect}
                dateCellRender={dateCellRender}
                monthCellRender={monthCellRender}
                onPanelChange={changeSelectedDate}
            />
        </Flex>
    );
};
