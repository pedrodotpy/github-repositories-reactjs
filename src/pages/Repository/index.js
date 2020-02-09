import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import {
    Loading,
    Owner,
    IssueList,
    Pagination,
    RepositoryFilter,
} from './styles';

class Repository extends Component {
    constructor() {
        super();
        this.state = {
            repository: {},
            issues: [],
            loading: true,
            filters: [
                { value: 'open', label: 'Abertas' },
                { value: 'closed', label: 'Fechadas' },
                { value: 'all', label: 'Todas' },
            ],
            currentFilter: 'open',
            currentPage: 1,
        };
    }

    async componentDidMount() {
        const { match } = this.props;

        const repoName = decodeURIComponent(match.params.repository);

        const [repository, issues] = await Promise.all([
            api.get(`repos/${repoName}`),
            api.get(`repos/${repoName}/issues`, {
                params: {
                    state: 'open',
                    per_page: 5,
                },
            }),
        ]);

        this.setState({
            repository: repository.data,
            issues: issues.data,
            loading: false,
        });
    }

    handleFilterUpdate = async e => {
        await this.setState({ currentFilter: e.target.value, currentPage: 1 });

        this.loadIssues();
    };

    handlePage = async pageAction => {
        const { currentPage } = this.state;
        const newPage = currentPage + pageAction;

        await this.setState({ currentPage: newPage });

        this.loadIssues();
    };

    async loadIssues() {
        const { repository, currentFilter, currentPage } = this.state;

        const issues = await api.get(`repos/${repository.full_name}/issues`, {
            params: {
                state: currentFilter,
                per_page: 5,
                page: currentPage,
            },
        });
        this.setState({ issues: issues.data });
    }

    render() {
        const {
            repository,
            issues,
            loading,
            filters,
            currentFilter,
            currentPage,
        } = this.state;

        if (loading) {
            return <Loading>Carregando</Loading>;
        }

        return (
            <Container>
                <Owner>
                    <Link to="/">Voltar aos reposositórios</Link>
                    <img
                        src={repository.owner.avatar_url}
                        alt={repository.owner.login}
                    />
                    <h1>{repository.name}</h1>
                    <p>{repository.description}</p>
                </Owner>
                <RepositoryFilter
                    name="state"
                    value={currentFilter}
                    onChange={this.handleFilterUpdate}
                >
                    {filters.map(filter => (
                        <option key={filter.value} value={filter.value}>
                            {filter.label}
                        </option>
                    ))}
                </RepositoryFilter>

                <IssueList>
                    {issues.map(issue => (
                        <li key={String(issue.id)}>
                            <img
                                src={issue.user.avatar_url}
                                alt={issue.user.login}
                            />
                            <div>
                                <strong>
                                    <a href={issue.html_url}>{issue.title}</a>
                                    {issue.labels.map(label => (
                                        <span key={String(label.id)}>
                                            {label.name}
                                        </span>
                                    ))}
                                </strong>
                                <p>{issue.user.login}</p>
                            </div>
                        </li>
                    ))}
                </IssueList>
                <Pagination>
                    <button
                        type="button"
                        onClick={() => this.handlePage(-1)}
                        disabled={currentPage < 2}
                    >
                        Anterior
                    </button>
                    <button type="button" onClick={() => this.handlePage(1)}>
                        Próxima
                    </button>
                </Pagination>
            </Container>
        );
    }
}

Repository.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            repository: PropTypes.string,
        }),
    }).isRequired,
};

export default Repository;
