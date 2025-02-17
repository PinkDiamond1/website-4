import * as React from 'react';
import styled from 'styled-components';

import { colors } from '../../style/colors';
import { CheckMark } from '../ui/check_mark';
import { Container } from '../ui/container';

export enum InputWidth {
    Half = 'half',
    Full = 'full',
}

interface InputProps {
    className?: string;
    name?: string;
    width?: InputWidth | string;
    label?: string;
    type?: string;
    value?: string;
    defaultValue?: string;
    errors?: ErrorProps;
    isErrors?: boolean;
    required?: boolean;
    placeholder?: string;
    onChange?: (e: any) => void;
}

interface OptionSelectorProps {
    name: string;
    width?: InputWidth;
    label: string;
    errors?: ErrorProps;
    isErrors?: boolean;
    required?: boolean;
    children: React.ReactNode;
    isFlex?: boolean;
}

interface CheckBoxProps {
    label: string;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
    isSelected: boolean;
}

interface ErrorProps {
    [key: string]: string;
}

export const OptionSelector = (props: OptionSelectorProps) => {
    const id = `input-${name}`;
    return (
        <InputWrapper {...props}>
            <Label htmlFor={id}>{props.label}</Label>
            <Container id={id}>{props.children}</Container>
        </InputWrapper>
    );
};

export const CheckBoxInput = (props: CheckBoxProps) => {
    const { isSelected, label, onClick } = props;
    return (
        <Container onClick={onClick} className="flex items-center">
            <Container marginRight="10px" minWidth={40}>
                <CheckMark isChecked={isSelected} color={colors.brandLight} />
            </Container>
            <Label style={{ marginBottom: '0' }}>{label}</Label>
        </Container>
    );
};

interface WrappedReactNode {
    item: React.ReactNode[];
    value: string;
}

interface GenericDropdownProps {
    items: string[] | readonly string[] | WrappedReactNode[];
    name: string;
    errors?: ErrorProps;
    label: string;
    defaultValue?: string;
    onItemSelected?: (item: string) => any;
    width?: InputWidth;
}

export const GenericDropdown = ({
    items,
    defaultValue = typeof items[0] === 'string' ? items[0] : items[0].value,
    // tslint:disable-next-line:no-empty
    onItemSelected = () => {},
    width = InputWidth.Full,
    errors,
    name,
    label,
}: GenericDropdownProps) => {
    const id = `input-${name}`;
    const [currentValue, setCurrentValue] = React.useState(defaultValue);
    const isErrors = errors && errors.hasOwnProperty(name) && errors[name] !== null;
    const errorMessage = isErrors ? errors[name] : null;

    const handleChange = React.useCallback(
        (event) => {
            setCurrentValue(event.target.value);
            onItemSelected(event.target.value);
        },
        [onItemSelected],
    );

    return (
        <InputWrapper width={width}>
            <Label htmlFor={id}>{label}</Label>
            <StyledDropdownContainer id={id} isErrors={isErrors}>
                <StyledDropdown
                    value={currentValue}
                    onChange={handleChange}
                    isErrors={isErrors}
                    style={{ color: currentValue === '' ? 'gray' : undefined }}
                >
                    <option value="" disabled={true} selected={true} color="gray">
                        Select
                    </option>
                    {items.map((item: string | WrappedReactNode) => {
                        if (typeof item === 'string') {
                            return (
                                <option value={item} key={`item-${item}`}>
                                    {item}
                                </option>
                            );
                        }
                        return (
                            <option value={item.value} key={`item-${item.value}`}>
                                {item.item}
                            </option>
                        );
                    })}
                </StyledDropdown>
            </StyledDropdownContainer>
            {isErrors && <Error>{errorMessage}</Error>}
        </InputWrapper>
    );
};

export const Input = React.forwardRef((props: InputProps, ref?: React.Ref<HTMLInputElement>) => {
    const { name, label, type, errors, defaultValue, onChange, width, className, placeholder, value } = props;
    const id = `input-${name}`;
    const componentType = type === 'textarea' ? 'textarea' : 'input';
    const isErrors = errors.hasOwnProperty(name) && errors[name] !== null;
    const errorMessage = isErrors ? errors[name] : null;
    const inputProps = { name, type, value };

    return (
        <InputWrapper className={className} width={width}>
            <Label htmlFor={id}>{label}</Label>
            <StyledInput
                as={componentType}
                ref={ref}
                id={id}
                isErrors={isErrors}
                defaultValue={defaultValue}
                onChange={onChange}
                placeholder={placeholder}
                {...inputProps}
            />
            {isErrors && <Error>{errorMessage}</Error>}
        </InputWrapper>
    );
});

Input.defaultProps = {
    width: InputWidth.Full,
    errors: {},
};

const StyledInput = styled.input`
    appearance: none;
    background-color: #fff;
    border: 1px solid #d5d5d5;
    color: #000;
    font-size: 1.111111111rem;
    padding: 16px 15px 14px;
    outline: none;
    width: 100%;
    min-height: ${(props) => props.type === 'textarea' && `120px`};

    background-color: ${(props: InputProps) => props.isErrors && `#FDEDED`};
    border-color: ${(props: InputProps) => props.isErrors && `#FD0000`};

    &::placeholder {
        color: #c3c3c3;
        font-family: 'Formular';
    }
`;

const StyledDropdown = styled.select`
    height: auto !important;
    outline: none;
    width: 100%;
    border: none;
    background-color: #fff;
    background-color: ${(props: InputProps) => props.isErrors && `#FDEDED`};
    font-size: 1.111111111rem !important;
`;

const StyledDropdownContainer = styled.div`
    background-color: #fff;
    background-color: ${(props: InputProps) => props.isErrors && `#FDEDED`};
    border-color: ${(props: InputProps) => props.isErrors && `#FD0000`};
    border: 1px solid #d5d5d5;
    padding: 16px 15px 14px;
    color: #000;
    height: auto !important;
    font-size: 1.111111111rem !important;
    outline: none;
    width: 100%;
`;

const InputWrapper = styled.div<InputProps>`
    position: relative;
    flex-grow: ${(props) => props.width === InputWidth.Full && 1};
    width: ${(props) => props.width === InputWidth.Half && `calc(50% - 15px)`};

    @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 30px;
    }
`;

const Label = styled.label`
    color: #000;
    font-size: 1.111111111rem;
    line-height: 1.4em;
    margin-bottom: 10px;
    display: inline-block;
`;

const Error = styled.span`
    color: #fd0000;
    font-size: 0.833333333rem;
    line-height: 1em;
    display: inline-block;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transform: translateY(24px);
`;
